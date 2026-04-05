import {
  OptionalProviderComponent,
  OptionalProviderFn,
} from './types/optional-provider.js';
import { Provider, ProviderComponent, ProviderFn } from './types/provider.js';
import { getComponent } from './get-component.js';

/**
 * Options for the {@link FallbackProvider} constructor.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *                If not provided, the provider does not expect an argument.
 */
export type FallbackProviderOptions<R, T = void> = {
  /** The optional provider component to wrap. When it returns `undefined`, the fallback is used. */
  provider: OptionalProviderComponent<R, T>;

  /**
   * A static fallback value returned when the provider returns `undefined`.
   * If neither `defaultValue` nor `defaultValueProvider` is supplied, an error
   * is thrown at construction time.
   */
  defaultValue?: R;

  /**
   * A provider component whose result is used as the fallback when the wrapped
   * provider returns `undefined`. Takes precedence over `defaultValue` when both
   * are supplied.
   */
  defaultValueProvider?: ProviderComponent<R, T>;
};

/**
 * Wraps an optional provider and guarantees a non-`undefined` result by
 * applying a fallback when the inner provider returns `undefined`.
 *
 * The fallback is either a static `defaultValue` or a `defaultValueProvider`
 * (which takes precedence). At least one must be supplied; if neither is
 * provided the constructor throws immediately.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *                If not provided, the provider does not expect an argument.
 */
export class FallbackProvider<R, T = void> implements Provider<R, T> {
  #optionalProvider: OptionalProviderFn<R, T>;
  #defaultValueProvider: ProviderFn<R, T>;

  constructor(opts: FallbackProviderOptions<R, T>) {
    if (opts.defaultValue === undefined && !opts.defaultValueProvider) {
      throw new Error(
        'Either defaultValue or defaultValueProvider must be provided.',
      );
    }
    this.#optionalProvider = getComponent(opts.provider, 'get');
    this.#defaultValueProvider = getComponent(
      opts.defaultValueProvider,
      'get',
      {
        default: () => opts.defaultValue!,
      },
    );
  }

  /**
   * Wraps an optional provider with a static fallback value, returning a new
   * {@link FallbackProvider} instance.
   *
   * @param provider - The optional provider component to wrap.
   * @param defaultValue - The fallback value to return if the provider returns `undefined`.
   * @returns A new {@link FallbackProvider} wrapping the provided component.
   */
  static wrap<R, T = void>(
    provider: OptionalProviderComponent<R, T>,
    defaultValue: R,
  ): Provider<R, T> {
    if (defaultValue === undefined) {
      throw new TypeError(
        'defaultValue must be provided and cannot be undefined.',
      );
    }
    return new FallbackProvider<R, T>({ provider, defaultValue });
  }

  /**
   * Gets the value from the wrapped provider, returning the fallback value if
   * the provider returns `undefined`.
   *
   * @param arg - The argument to pass to the provider function.
   * @returns The provider's value, or the fallback if the provider returned `undefined`.
   * @throws {Error} If both the provider and the fallback return `undefined`.
   */
  async get(arg: T): Promise<R> {
    let result = await this.#optionalProvider(arg);
    result ??= await this.#defaultValueProvider(arg);

    if (result === undefined) {
      throw new Error('No default value could be provided.');
    }

    return result!;
  }
}
