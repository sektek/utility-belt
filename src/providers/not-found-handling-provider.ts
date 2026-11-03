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
   * Wraps a provider component into a NotFoundHandlingProvider.
   *
   * @param provider - The provider component to wrap.
   * @returns An instance of NotFoundHandlingProvider.
   */
  static wrap<R, T = void>(
    provider: ProviderComponent<R, T>,
  ): NotFoundHandlingProvider<R, T> {
    return new NotFoundHandlingProvider<R, T>({ provider });
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

/**
 * Wraps a provider so that a {@link ResourceNotFoundError} becomes an
 * `undefined` result, turning it into an optional provider.
 *
 * @param provider - The provider component to wrap.
 * @returns A {@link NotFoundHandlingProvider} wrapping the provider.
 */
export const optional = <R, T = void>(
  provider: ProviderComponent<R, T>,
): NotFoundHandlingProvider<R, T> => NotFoundHandlingProvider.wrap(provider);
