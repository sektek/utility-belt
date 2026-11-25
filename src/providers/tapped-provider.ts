import { CommandComponent, CommandFn } from '../types/command.js';
import { Provider, ProviderComponent, ProviderFn } from '../types/provider.js';
import { getComponent } from '../get-component.js';

/**
 * Options for creating a TappedProvider.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the context passed to the handler and provider.
 */
export type TappedProviderOptions<R, T = void> = {
  /**
   * The provider whose value is returned.
   */
  provider: ProviderComponent<R, T>;

  /**
   * A command invoked with the context before the provider is called.
   * Its return value is ignored.
   */
  handler: CommandComponent<T>;
};

/**
 * A provider that runs a handler with the context before delegating to a
 * provider and returning its value unchanged. The handler is awaited first.
 * If the handler throws or rejects, the error propagates and the provider is
 * not called.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the context passed to the handler and provider.
 */
export class TappedProvider<R, T = void> implements Provider<R, T> {
  #provider: ProviderFn<R, T>;
  #handler: CommandFn<T>;

  constructor(opts: TappedProviderOptions<R, T>) {
    this.#provider = getComponent(opts.provider, 'get');
    this.#handler = getComponent(opts.handler, 'execute');
  }

  async get(context: T): Promise<R> {
    await this.#handler(context);

    return await this.#provider(context);
  }
}
