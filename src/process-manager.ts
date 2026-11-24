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
import { toError } from './errors/to-error.js';

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
    /**
     * When `true` and a service fails to start, the services that had already
     * started successfully are stopped (using the same execution strategy and
     * stop timeout as a regular stop) before the start failure is rethrown.
     * Services whose `start()` rejected or never ran are not stopped. A failure
     * while stopping is reported but never replaces the original start failure.
     * Defaults to `false` (already started services are left running).
     */
    stopOnError?: boolean;
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
  #stopOnError: boolean;
  #startables: Set<Startable> = new Set();
  #stoppables: Set<Stoppable> = new Set();
  #signalListener: (() => void) | undefined;
  #managesOwnSignals: boolean;
  #started = false;
  #stopped = false;
  #starting: Promise<void> | undefined;
  #stopping: Promise<void> | undefined;

  constructor(opts: ProcessManagerOptions) {
    super(opts);

    this.#executionStrategy = getComponent(
      opts.executionStrategy ?? serialExecutionStrategy,
      'execute',
    );
    this.#maxStartWaitMs = opts.maxStartWaitMs ?? Infinity;
    this.#maxStopWaitMs = opts.maxStopWaitMs ?? Infinity;
    this.#stopOnError = opts.stopOnError ?? false;
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
   * A service may implement both. Adding a `Stoppable` after the manager has
   * stopped makes the next `stop()` run again so the new service is stopped too.
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
      this.#stopped = false;
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
   * If `stopOnError` is enabled and a service fails to start, the services whose
   * `start()` had resolved are stopped first (with the same execution strategy and
   * `maxStopWaitMs` as `stop()`, emitting `service:stopped` or `service:stopError`), then `service:startError`
   * is emitted and the original start failure is rethrown. A failure while rolling
   * back never replaces it, and the manager is not marked as started.
   * With the parallel strategy every in-flight start settles before the rollback.
   *
   * The call is idempotent. Concurrent calls share the single in-flight run, so
   * every caller sees the same outcome (resolution or the same rejection). A call
   * after a successful start resolves immediately without starting the services
   * again. A failed start does not mark the manager as started, so it may be
   * retried, and a `start()` after a completed `stop()` starts the services again.
   * Lifecycle events are emitted once per run, not once per call. Calling `start()`
   * while a `stop()` is in flight is not coordinated: the two runs proceed independently.
   *
   * @returns A promise that resolves once the services are started.
   * @throws {Error} If any service's `start()` rejects, or if a service exceeds `maxStartWaitMs`.
   * The rejection is emitted as `service:startError` and rethrown unchanged.
   */
  start(): Promise<void> {
    if (this.#starting) {
      return this.#starting;
    }

    if (this.#started) {
      return Promise.resolve();
    }

    this.#starting = this.#startOnce();

    return this.#starting;
  }

  async #startOnce(): Promise<void> {
    try {
      await this.#runStart();
    } finally {
      this.#starting = undefined;
    }
  }

  async #runStart(): Promise<void> {
    const logger = this.logger();
    const started: Startable[] = [];
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
                started.push(s);
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
      if (this.#stopOnError) {
        await this.#rollBack(started);
      }

      this.emit(SERVICE_START_ERROR, toError(error));
      throw error;
    }

    this.#started = true;
    this.#stopped = false;
    this.emit(SERVICE_STARTED);
  }

  /**
   * Stops all registered `Stoppable` services using the configured execution strategy.
   * If `maxStopWaitMs` is set, each individual service must complete within that limit.
   * If this manager owns SIGTERM/SIGINT listeners, they are removed.
   *
   * The call is idempotent. Concurrent calls (for example a signal and an explicit
   * `stop()`) share the single in-flight run, so every caller sees the same outcome
   * (resolution or the same rejection). A call after a successful stop resolves
   * immediately without stopping the services again. A manager that was never
   * started can still be stopped. A failed stop does not mark the manager as
   * stopped, so it may be retried. Lifecycle events are emitted once per run, not
   * once per call. Calling `stop()` while a `start()` is in flight is not
   * coordinated: the two runs proceed independently.
   *
   * @returns A promise that resolves once the services are stopped.
   * @throws {Error} If any service's `stop()` rejects, or if a service exceeds `maxStopWaitMs`.
   * The rejection is emitted as `service:stopError` and rethrown unchanged.
   */
  stop(): Promise<void> {
    if (this.#stopping) {
      return this.#stopping;
    }

    if (this.#stopped) {
      return Promise.resolve();
    }

    this.#stopping = this.#stopOnce();

    return this.#stopping;
  }

  async #stopOnce(): Promise<void> {
    try {
      await this.#runStop();
    } finally {
      this.#stopping = undefined;
    }
  }

  async #runStop(): Promise<void> {
    this.#unregisterSignalListener();
    await this.#stopServices(this.#stoppables);
    this.#stopped = true;
    this.#started = false;
  }

  async #rollBack(started: Startable[]): Promise<void> {
    const stoppables: Stoppable[] = [];
    for (const service of started) {
      if (isStoppable(service)) {
        stoppables.push(service);
      }
    }

    if (stoppables.length === 0) {
      return;
    }

    try {
      await this.#stopServices(stoppables);
    } catch (error) {
      this.logger().error('stopping started services failed', { error });
    }
  }

  async #stopServices(services: Iterable<Stoppable>): Promise<void> {
    const logger = this.logger();
    const stoppables = [...services];
    logger.info('stopping services', { count: stoppables.length });
    try {
      await this.#executionStrategy(
        stoppables.map(
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
