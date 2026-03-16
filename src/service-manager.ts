import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
  Service,
  Startable,
  Stoppable,
} from './types/index.js';

import { getComponent } from './get-component.js';

import { serialExecutionStrategy } from './execution-strategies/serial-execution-strategy.js';

export type ServiceManagerOptions = {
  executionStrategy?: ExecutionStrategyComponent;
};

export class ServiceManager implements Service {
  #executionStrategy: ExecutionStrategyFn;
  #startables: Set<Startable> = new Set();
  #stoppables: Set<Stoppable> = new Set();

  constructor(opts: ServiceManagerOptions = {}) {
    this.#executionStrategy = getComponent(opts.executionStrategy, 'execute', {
      default: serialExecutionStrategy,
    });
  }

  add(service: unknown) {
    if (typeof service === 'object' && service !== null) {
      if ('start' in service && typeof service.start === 'function') {
        this.#startables.add(service as Startable);
      }
      if ('stop' in service && typeof service.stop === 'function') {
        this.#stoppables.add(service as Stoppable);
      }
    }
  }

  async start() {
    await this.#executionStrategy(
      this.#startables
        .values()
        .map(startable => startable.start.bind(startable)),
    );
  }
  async stop() {
    await this.#executionStrategy(
      this.#stoppables
        .values()
        .map(stoppable => stoppable.stop.bind(stoppable)),
    );
  }
}
