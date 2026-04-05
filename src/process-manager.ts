import { AbstractComponent, ComponentOptions } from './abstract-component.js';
import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  Startable,
  Stoppable,
} from './types/index.js';
import { getComponent } from './get-component.js';
import { isNamed } from './is-named.js';
import { serialExecutionStrategy } from './execution-strategies/index.js';

export type ProcessManagerOptions = ComponentOptions & {
  /**
   * The execution strategy to use when starting and stopping services.
   * Accepts either an `ExecutionStrategy` object or a plain function.
   * Defaults to serial execution.
   */
  executionStrategy?: ExecutionStrategyComponent;
  /**
   * Maximum time in milliseconds each individual service is allowed to take
   * to complete its `start()` call. Rejects with an error if any single
   * service exceeds this deadline.
   * Defaults to `Infinity` (no timeout).
   */
  maxStartWaitMs?: number;
  /**
   * Maximum time in milliseconds each individual service is allowed to take
   * to complete its `stop()` call. Rejects with an error if any single
   * service exceeds this deadline.
   * Defaults to `Infinity` (no timeout).
   */
  maxStopWaitMs?: number;
  /**
   * An optional `ProcessManager` to register this instance with.
   * When provided, this manager's `start` and `stop` are delegated to it,
   * and no SIGTERM/SIGINT listeners are registered.
   */
  processManager?: ProcessManager;
};

/**
 * Manages the lifecycle of a collection of `Startable` and `Stoppable` services,
 * coordinating their start and stop calls via a pluggable execution strategy.
 *
 * Services are registered with `add()` and may implement `Startable`, `Stoppable`,
 * or both. `start()` and `stop()` then invoke the respective lifecycle methods
 * according to the configured strategy (serial by default).
 *
 * Optional per-service timeouts (`maxStartWaitMs` / `maxStopWaitMs`) cause the
 * corresponding call to reject if an individual service has not completed within
 * the allotted time. If the timed-out service implements `Named`, its name is
 * included in the error message.
 *
 * @example
 * const manager = new ProcessManager({
 *   name: 'app',
 *   executionStrategy: new ParallelExecutionStrategy(),
 *   maxStartWaitMs: 5000,
 *   maxStopWaitMs: 3000,
 * });
 * manager.add(myService);
 * await manager.start();
 * // … later …
 * await manager.stop();
 */
export class ProcessManager extends AbstractComponent {
  #executionStrategy: ExecutionStrategyFn;
  #maxStartWaitMs: number;
  #maxStopWaitMs: number;
  #startables: Set<Startable> = new Set();
  #stoppables: Set<Stoppable> = new Set();
  #signalListener: (() => void) | undefined;

  constructor(opts: ProcessManagerOptions) {
    super(opts);

    this.#executionStrategy = getComponent(
      opts.executionStrategy ?? serialExecutionStrategy,
      'execute',
    );
    this.#maxStartWaitMs = opts.maxStartWaitMs ?? Infinity;
    this.#maxStopWaitMs = opts.maxStopWaitMs ?? Infinity;
    if (opts.processManager) {
      opts.processManager.add(this);
    } else {
      this.#signalListener = this.stop.bind(this);
      process.on('SIGTERM', this.#signalListener);
      process.on('SIGINT', this.#signalListener);
    }
  }

  /**
   * Registers a service with this manager.
   * If the service implements `Startable` it will be started by `start()`.
   * If it implements `Stoppable` it will be stopped by `stop()`.
   * A service may implement both.
   *
   * @param service - The service to register.
   */
  add(service: Startable | Stoppable): void {
    const logger = this.logger();
    const serviceName = isNamed(service) ? service.name : undefined;

    if ('start' in service) {
      logger.info('startable added', { service: serviceName });
      this.#startables.add(service);
    }

    if ('stop' in service) {
      logger.info('stoppable added', { service: serviceName });
      this.#stoppables.add(service);
    }
  }

  /**
   * Starts all registered `Startable` services using the configured execution strategy.
   * If `maxStartWaitMs` is set, each individual service must complete within that limit.
   *
   * @throws {Error} If any service's `start()` rejects, or if a service exceeds `maxStartWaitMs`.
   */
  async start(): Promise<void> {
    const logger = this.logger();
    logger.info('starting services', { count: this.#startables.size });
    await this.#executionStrategy(
      [...this.#startables].map(
        s => () =>
          this.#withTimeout(
            async () => {
              const serviceName = isNamed(s) ? s.name : undefined;
              const startTime = Date.now();
              logger.info('starting service', { service: serviceName });
              await s.start();
              const duration = Date.now() - startTime;
              logger.info('service started', {
                service: serviceName,
                durationMs: duration,
              });
            },
            this.#maxStartWaitMs,
            'start',
            s,
          ),
      ),
    );
  }

  /**
   * Stops all registered `Stoppable` services using the configured execution strategy.
   * If `maxStopWaitMs` is set, each individual service must complete within that limit.
   * If SIGTERM/SIGINT listeners were registered at construction, they are removed.
   *
   * @throws {Error} If any service's `stop()` rejects, or if a service exceeds `maxStopWaitMs`.
   */
  async stop(): Promise<void> {
    const logger = this.logger();
    logger.info('stopping services', { count: this.#stoppables.size });
    if (this.#signalListener) {
      process.off('SIGTERM', this.#signalListener);
      process.off('SIGINT', this.#signalListener);
      this.#signalListener = undefined;
    }
    await this.#executionStrategy(
      [...this.#stoppables].map(
        s => () =>
          this.#withTimeout(
            async () => {
              const serviceName = isNamed(s) ? s.name : undefined;
              const startTime = Date.now();
              logger.info('stopping service', { service: serviceName });
              await s.stop();
              const duration = Date.now() - startTime;
              logger.info('service stopped', {
                service: serviceName,
                durationMs: duration,
              });
            },
            this.#maxStopWaitMs,
            'stop',
            s,
          ),
      ),
    );
  }

  async #withTimeout(
    fn: () => PromiseLike<void> | void,
    maxWaitMs: number,
    phase: 'start' | 'stop',
    service: object,
  ): Promise<void> {
    const promise = Promise.resolve(fn());
    if (!isFinite(maxWaitMs)) {
      await promise;
      return;
    }

    const serviceName = isNamed(service) ? service.name : undefined;
    let handle: ReturnType<typeof setTimeout>;
    const timeout = new Promise((_resolve, reject) => {
      handle = setTimeout(() => {
        const error = new Error(
          `ProcessManager '${this.name}': service '${serviceName}' - ${phase} timed out`,
        );
        reject(error);
      }, maxWaitMs);
    });

    try {
      await Promise.race([promise, timeout]);
    } finally {
      clearTimeout(handle!);
    }
  }
}
