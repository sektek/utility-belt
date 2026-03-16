import { CommandComponent, CommandFn } from './types/command.js';
import {
  ErrorHandlerComponent,
  ErrorHandlerFn,
} from './types/error-handler.js';
import { ProviderComponent, ProviderFn } from './types/provider.js';
import { Service } from './types/service.js';

import { getComponent } from './get-component.js';
import { noOp } from './no-op.js';

type Timeout = ReturnType<typeof setTimeout>;

/**
 * Options for configuring a RepeatingExecutor.
 * Either `task` or `taskProvider` must be provided.
 */
export type RepeatingExecutorOptions<T = void> = {
  /**
   * The context to be passed to the task command.
   * If the context type is void, this should not be provided.
   */
  context?: T extends void ? undefined : T;

  /**
   * A provider that returns the context to be passed to the task command.
   * If not provided, the static context (if any) will be used. If the context
   * type is void, this should not be provided.
   */
  contextProvider?: ProviderComponent<T>;

  errorHandler?: ErrorHandlerComponent<T>;

  /** A provider that returns the next execution time in milliseconds since epoch. */
  scheduleProvider: ProviderComponent<number>;

  /** A command component representing the task to be executed repeatedly. */
  task?: CommandComponent<T>;

  /** A provider that returns a command component for the task to be executed. */
  taskProvider?: ProviderComponent<CommandComponent<T>>;
};

/**
 * A service that repeatedly executes a task based on a schedule provided by a provider.
 */
export class RepeatingExecutor<T = void> implements Service {
  #contextProvider: ProviderFn<T>;
  #errorHandler: ErrorHandlerFn<T>;
  #nextTimeout: Timeout | null = null;
  #scheduleProvider: ProviderFn<number>;
  #taskProvider: ProviderFn<CommandComponent<T>>;

  constructor(opts: RepeatingExecutorOptions<T>) {
    if (!opts.task && !opts.taskProvider) {
      throw new Error(
        'Either task or taskProvider must be provided to RepeatingExecutor',
      );
    }

    this.#scheduleProvider = getComponent(opts.scheduleProvider, 'get');
    this.#taskProvider = getComponent(opts.taskProvider, 'get', {
      default: () => opts.task!,
    });

    this.#contextProvider = getComponent(opts.contextProvider, 'get', {
      default: () => opts.context as unknown as T,
    });

    this.#errorHandler = getComponent(opts.errorHandler, 'handle', {
      default: noOp,
    });
  }

  async #execute(): Promise<void> {
    let context: T | undefined;

    try {
      const taskComponent = await this.#taskProvider();
      context = await this.#contextProvider();
      const task: CommandFn<T> = getComponent(taskComponent, 'execute');

      await task(context);
    } catch (error) {
      await this.#errorHandler(error, context);
    } finally {
      await this.#scheduleNextExecution();
    }
  }

  async #scheduleNextExecution(): Promise<void> {
    const now = Date.now();
    const nextExecution = await this.#scheduleProvider();
    const delay = Math.max(0, nextExecution - now);
    this.#nextTimeout = setTimeout(this.#execute.bind(this), delay);
  }

  async start(): Promise<void> {
    if (this.#nextTimeout) {
      return;
    }
    await this.#scheduleNextExecution();
  }

  async stop(): Promise<void> {
    if (this.#nextTimeout) {
      clearTimeout(this.#nextTimeout);
      this.#nextTimeout = null;
    }
  }
}
