import { SERVICE_STARTED, SERVICE_STOPPED, Service } from './types/index.js';

import { AbstractComponent, ComponentOptions } from './abstract-component.js';
import { ProcessManager } from './process-manager.js';

/**
 * Options for {@link AbstractService}.
 *
 * Extends {@link ComponentOptions} with an optional `processManager` for
 * lifecycle coordination.
 */
export type ServiceOptions = ComponentOptions & {
  /**
   * An existing {@link ProcessManager} to register this service with.
   * When provided, the service's `start` and `stop` are delegated to that
   * manager and no SIGTERM/SIGINT listeners are registered.
   * When omitted, a new internal `ProcessManager` is created automatically.
   */
  processManager?: ProcessManager;
};

/**
 * Base class for services that participate in a managed lifecycle.
 *
 * Extends {@link AbstractComponent} and implements {@link Service}
 * (`start` + `stop`). On construction it registers itself with a
 * {@link ProcessManager} so that it is started and stopped as part of the
 * application lifecycle:
 *
 * - If `opts.processManager` is supplied, the service registers with that
 *   manager and no signal listeners are added.
 * - If no `processManager` is supplied, a new internal `ProcessManager` is
 *   created (inheriting this service's `loggerProvider`) and the service
 *   registers with it. That manager installs SIGTERM/SIGINT listeners.
 *
 * The service emits the lifecycle events in {@link ServiceEvents}. The
 * default `start()` and `stop()` are no-ops that emit `service:started` and
 * `service:stopped`; they cannot fail, so they never emit
 * `service:startError` or `service:stopError`.
 *
 * A subclass that overrides `start()` or `stop()` replaces the default and
 * must emit the events itself: `service:started`/`service:stopped` on
 * success, and `service:startError`/`service:stopError` with the original
 * error on failure, rethrowing the error unchanged.
 */
export abstract class AbstractService
  extends AbstractComponent
  implements Service
{
  constructor(opts: ServiceOptions = {}) {
    super(opts);

    if (opts.processManager) {
      opts.processManager.add(this);
    } else {
      const processManager = new ProcessManager({
        loggerProvider: this.loggerProvider,
      });
      processManager.add(this);
    }
  }

  /**
   * No-op start implementation that emits `service:started`. Subclasses override this
   * to perform startup logic and must emit the lifecycle events themselves.
   */
  async start() {
    this.emit(SERVICE_STARTED);
  }

  /**
   * No-op stop implementation that emits `service:stopped`. Subclasses override this
   * to perform shutdown logic and must emit the lifecycle events themselves.
   */
  async stop() {
    this.emit(SERVICE_STOPPED);
  }
}
