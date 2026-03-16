import { Command, CommandComponent, CommandFn } from './types/command.js';
import {
  ExecutionStrategyComponent,
  ExecutionStrategyFn,
} from './types/execution-strategy.js';
import {
  IterableProviderComponent,
  IterableProviderFn,
} from './types/iterable-provider.js';
import { getComponent } from './get-component.js';
import { parallelExecutionStrategy } from './execution-strategies/parallel-execution-strategy.js';

/**
 * An async iterable that yields command functions from command components
 * provided by an iterable provider function.
 *
 * @template T The type of argument accepted by the command functions.
 */
class CommandExecutableFnIterable<T = void> implements AsyncIterable<
  CommandFn<T>
> {
  #commandsProvider: IterableProviderFn<CommandComponent<T>, T>;
  #arg: T;

  constructor(
    commandsProvider: IterableProviderFn<CommandComponent<T>, T>,
    arg: T,
  ) {
    this.#commandsProvider = commandsProvider;
    this.#arg = arg;
  }

  async *[Symbol.asyncIterator](): AsyncIterator<CommandFn<T>> {
    const commands = await this.#commandsProvider(this.#arg);
    for await (const commandComponent of commands) {
      yield getComponent(commandComponent, 'execute');
    }
  }
}

/**
 * Options for configuring a CompositeCommand.
 * Either `commands` or `commandsProvider` must be provided.
 *
 * @template T The type of argument accepted by the command functions.
 */
export type CompositeCommandOptions<T = void> = {
  /**
   * An iterable of command components to be composed.
   * If not provided, `commandsProvider` must be specified.
   * Ignored if `commandsProvider` is provided.
   */
  commands?: Iterable<CommandComponent<T>>;
  /**
   * A provider that returns an iterable of command components to be composed.
   * If not provided, `commands` must be specified.
   */
  commandsProvider?: IterableProviderComponent<CommandComponent<T>, T>;
  /**
   * The strategy to use for executing the composed commands.
   * Defaults to `ParallelExecutionStrategy`.
   */
  executionStrategy?: ExecutionStrategyComponent<CommandFn<T>>;
};

/**
 * A command that composes multiple commands and executes them
 * according to a specified execution strategy.
 *
 * @template T The type of argument accepted by the command functions.
 */
export class CompositeCommand<T = void> implements Command<T, void> {
  #commandsProvider: IterableProviderFn<CommandComponent<T>, T>;
  #executionStrategy: ExecutionStrategyFn<CommandFn<T>>;

  constructor(opts: CompositeCommandOptions<T>) {
    if (!opts.commands && !opts.commandsProvider) {
      throw new Error(
        'Either commands or commandsProvider must be provided to CompositeCommand',
      );
    }

    this.#commandsProvider = getComponent(opts.commandsProvider, 'get', {
      default: () => opts.commands!,
    });
    this.#executionStrategy = getComponent(opts.executionStrategy, 'execute', {
      default: parallelExecutionStrategy,
    });
  }

  async execute(arg: T): Promise<void> {
    const commandFnsIterable = new CommandExecutableFnIterable(
      this.#commandsProvider,
      arg,
    );

    await this.#executionStrategy(commandFnsIterable, arg);
  }
}
