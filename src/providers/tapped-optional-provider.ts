import {
  CommandComponent,
  CommandFn,
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '../types/index.js';
import { getComponent } from '../get-component.js';

/**
 * Options for creating a TappedOptionalProvider.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider and handler.
 */
export type TappedOptionalProviderOptions<R, T = void> = {
  /** The optional provider component whose value is returned. */
  provider: OptionalProviderComponent<R, T>;
  /**
   * The command component executed with the context before the provider is
   * invoked. Its result is ignored.
   */
  handler: CommandComponent<T>;
};

/**
 * A provider that executes a handler with the context before delegating to an
 * optional provider, returning the provider's value unchanged. The handler
 * runs even when the provider resolves to `undefined`.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider and handler.
 */
export class TappedOptionalProvider<R, T = void> implements OptionalProvider<
  R,
  T
> {
  #provider: OptionalProviderFn<R, T>;
  #handler: CommandFn<T>;

  constructor(options: TappedOptionalProviderOptions<R, T>) {
    this.#provider = getComponent(options.provider, 'get');
    this.#handler = getComponent(options.handler, 'execute');
  }

  /**
   * Awaits the handler with the context, then invokes the provider with the
   * same context.
   *
   * @param context - The argument to pass to the handler and provider.
   * @returns The value returned by the provider, or `undefined`.
   * @throws {Error} Any error thrown by the handler (the provider is then not called)
   *   or by the provider.
   */
  async get(context: T): Promise<R | undefined> {
    await this.#handler(context);

    return await this.#provider(context);
  }
}
