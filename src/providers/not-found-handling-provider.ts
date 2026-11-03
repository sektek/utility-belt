import {
  OptionalProvider,
  ProviderComponent,
  ProviderFn,
} from '../types/index.js';
import { ResourceNotFoundError } from '../errors/index.js';
import { getComponent } from '../get-component.js';

/**
 * Options for the {@link NotFoundHandlingProvider} constructor.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *   If not provided, the provider does not expect an argument.
 */
export type NotFoundHandlingProviderOptions<R, T = void> = {
  /** The provider component to wrap. */
  provider: ProviderComponent<R, T>;
};

/**
 * Wraps a provider that throws {@link ResourceNotFoundError} for missing
 * resources and turns that error into an `undefined` result. Any other error
 * is rethrown.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *   If not provided, the provider does not expect an argument.
 */
export class NotFoundHandlingProvider<R, T = void> implements OptionalProvider<
  R,
  T
> {
  #provider: ProviderFn<R, T>;

  constructor(opts: NotFoundHandlingProviderOptions<R, T>) {
    this.#provider = getComponent(opts.provider, 'get');
  }

  /**
   * @param arg - The argument to pass to the wrapped provider.
   * @returns The wrapped provider's value, or `undefined` when it throws a
   *   {@link ResourceNotFoundError}.
   */
  async get(arg: T): Promise<R | undefined> {
    try {
      return await this.#provider(arg);
    } catch (err) {
      if (err instanceof ResourceNotFoundError) {
        return undefined;
      }

      throw err;
    }
  }
}
