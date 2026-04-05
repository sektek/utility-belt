import { Service } from './types/service.js';

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
 * `start()` and `stop()` are no-ops by default; subclasses override them to
 * implement their own startup and shutdown logic.
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

  /** No-op start implementation. Subclasses override this to perform startup logic. */
  async start() {}

  /** No-op stop implementation. Subclasses override this to perform shutdown logic. */
  async stop() {}
}
