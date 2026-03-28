import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  Startable,
  Stoppable,
} from './types/index.js';
import { getComponent } from './get-component.js';
import { isNamed } from './is-named.js';
import { serialExecutionStrategy } from './execution-strategies/index.js';

export type ProcessManagerOptions = {
  /** A name identifying this process manager instance. */
  name: string;
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
export class ProcessManager {
  #name: string;
  #executionStrategy: ExecutionStrategyFn;
  #maxStartWaitMs: number;
  #maxStopWaitMs: number;
  #startables: Set<Startable> = new Set();
  #stoppables: Set<Stoppable> = new Set();
  #signalListener: (() => void) | undefined;

  /**
   * The name identifying this process manager instance.
   *
   * @returns The name of this process manager.
   */
  get name(): string {
    return this.#name;
  }

  constructor(opts: ProcessManagerOptions) {
    this.#name = opts.name;
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
    if ('start' in service) {
      this.#startables.add(service);
    }
    if ('stop' in service) {
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
    await this.#executionStrategy(
      [...this.#startables].map(
        s => () =>
          this.#withTimeout(() => s.start(), this.#maxStartWaitMs, 'start', s),
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
    if (this.#signalListener) {
      process.off('SIGTERM', this.#signalListener);
      process.off('SIGINT', this.#signalListener);
      this.#signalListener = undefined;
    }
    await this.#executionStrategy(
      [...this.#stoppables].map(
        s => () =>
          this.#withTimeout(() => s.stop(), this.#maxStopWaitMs, 'stop', s),
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
    const serviceName = isNamed(service) ? ` '${service.name}'` : '';
    const timeout = new Promise<never>((_resolve, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              `ProcessManager '${this.#name}': service${serviceName} ${phase} timed out`,
            ),
          ),
        maxWaitMs,
      ),
    );
    await Promise.race([promise, timeout]);
  }
}
