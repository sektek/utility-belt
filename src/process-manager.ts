import {
  EventEmittingService,
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  SERVICE_STARTED,
  SERVICE_START_ERROR,
  SERVICE_STOPPED,
  SERVICE_STOP_ERROR,
  ServiceEvents,
  Startable,
  StartableOptions,
  Stoppable,
  StoppableOptions,
} from './types/index.js';
import { AbstractComponent } from './abstract-component.js';
import { ServiceOptions } from './abstract-service.js';
import { getComponent } from './get-component.js';
import { isNamed } from './guards/is-named.js';
import { isStartable } from './guards/is-startable.js';
import { isStoppable } from './guards/is-stoppable.js';
import { serialExecutionStrategy } from './execution-strategies/index.js';

/**
 * Lifecycle events emitted by a {@link ProcessManager}; the same as
 * {@link ServiceEvents}.
 */
export type ProcessManagerEvents = ServiceEvents;

export type ProcessManagerOptions = ServiceOptions &
  StartableOptions &
  StoppableOptions & {
    /**
     * The execution strategy to use when starting and stopping services.
     * Accepts either an `ExecutionStrategy` object or a plain function.
     * Defaults to serial execution.
     */
    executionStrategy?: ExecutionStrategyComponent;
  };

/**
 * Returns `thrown` if it is an `Error`, otherwise an `Error` that wraps it as
 * its `cause`. Anything can be thrown or used to reject a promise, but the
 * error events promise their listeners an `Error`.
 *
 * @param thrown - The value a service threw or rejected with.
 * @returns `thrown` itself when it is an `Error`, otherwise a wrapping `Error`.
 */
function toError(thrown: unknown): Error {
  if (thrown instanceof Error) {
    return thrown;
  }

  return new Error(String(thrown), { cause: thrown });
}

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
 * The manager emits {@link ProcessManagerEvents} describing its own outcome:
 * `service:started`/`service:stopped` once the execution strategy resolves, and
 * `service:startError`/`service:stopError` when it rejects. The call rethrows
 * the rejection unchanged; the event carries the same object when it is an
 * `Error`, and otherwise an `Error` wrapping it as its `cause`. Events of the
 * registered services are not forwarded.
 *
 * When constructed without a parent `processManager`, SIGTERM/SIGINT listeners
 * are registered lazily on the first `Stoppable` added, and removed again once
 * `remove()` leaves it with no `Stoppable` left to protect — so a manager that
 * never outlives its services never leaks process-level signal handles.
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
export class ProcessManager
  extends AbstractComponent
  implements EventEmittingService<ProcessManagerEvents>
{
  #executionStrategy: ExecutionStrategyFn;
  #maxStartWaitMs: number;
  #maxStopWaitMs: number;
  #startables: Set<Startable> = new Set();
  #stoppables: Set<Stoppable> = new Set();
  #signalListener: (() => void) | undefined;
  #managesOwnSignals: boolean;

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
      this.#managesOwnSignals = false;
    } else {
      this.#managesOwnSignals = true;
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

    if (isStartable(service)) {
      logger.info('startable added', { service: serviceName });
      this.#startables.add(service);
    }

    if (isStoppable(service)) {
      logger.info('stoppable added', { service: serviceName });
      this.#stoppables.add(service);
      if (this.#managesOwnSignals) {
        this.#registerSignalListener();
      }
    }
  }

  remove(service: Startable | Stoppable): void {
    const logger = this.logger();
    const serviceName = isNamed(service) ? service.name : undefined;

    if (isStartable(service)) {
      logger.info('startable removed', { service: serviceName });
      this.#startables.delete(service);
    }

    if (isStoppable(service)) {
      logger.info('stoppable removed', { service: serviceName });
      this.#stoppables.delete(service);
      if (this.#managesOwnSignals && this.#stoppables.size === 0) {
        this.#unregisterSignalListener();
      }
    }
  }

  #registerSignalListener(): void {
    if (this.#signalListener) {
      return;
    }
    this.#signalListener = this.stop.bind(this);
    process.on('SIGTERM', this.#signalListener);
    process.on('SIGINT', this.#signalListener);
  }

  #unregisterSignalListener(): void {
    if (!this.#signalListener) {
      return;
    }
    process.off('SIGTERM', this.#signalListener);
    process.off('SIGINT', this.#signalListener);
    this.#signalListener = undefined;
  }

  /**
   * Starts all registered `Startable` services using the configured execution strategy.
   * If `maxStartWaitMs` is set, each individual service must complete within that limit.
   *
   * @throws {Error} If any service's `start()` rejects, or if a service exceeds `maxStartWaitMs`.
   * The rejection is emitted as `service:startError` and rethrown unchanged.
   */
  async start(): Promise<void> {
    const logger = this.logger();
    logger.info('starting services', { count: this.#startables.size });
    try {
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
    } catch (error) {
      this.emit(SERVICE_START_ERROR, toError(error));
      throw error;
    }

    this.emit(SERVICE_STARTED);
  }

  /**
   * Stops all registered `Stoppable` services using the configured execution strategy.
   * If `maxStopWaitMs` is set, each individual service must complete within that limit.
   * If this manager owns SIGTERM/SIGINT listeners, they are removed.
   *
   * @throws {Error} If any service's `stop()` rejects, or if a service exceeds `maxStopWaitMs`.
   * The rejection is emitted as `service:stopError` and rethrown unchanged.
   */
  async stop(): Promise<void> {
    const logger = this.logger();
    logger.info('stopping services', { count: this.#stoppables.size });
    this.#unregisterSignalListener();
    try {
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
    } catch (error) {
      this.emit(SERVICE_STOP_ERROR, toError(error));
      throw error;
    }

    this.emit(SERVICE_STOPPED);
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
