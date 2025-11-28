import {
  OptionalProviderComponent,
  OptionalProviderFn,
} from './types/optional-provider.js';
import { Provider, ProviderComponent, ProviderFn } from './types/provider.js';
import { getComponent } from './get-component.js';

/**
 * Options for the ProviderWrapper constructor.
 */
export type DefaultProviderOptions<R, T = void> = {
  /** The provider component that will be wrapped. */
  provider: OptionalProviderComponent<R, T>;
  /**
   * An optional default value to return if the provider returns undefined.
   * If not provided, an error will be thrown if the provider returns undefined.
   */
  defaultValue?: R;
  /** An optional default value provider component to get the default value from. */
  defaultValueProvider?: ProviderComponent<R, T>;
};

/**
 * ProviderWrapper is a class that wraps an optional provider component.
 * It provides a method to get a value from the provider, returning a default value
 * if the provider returns undefined.
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *                If not provided, the provider does not expect an argument.
 */
export class DefaultProvider<R, T = void> implements Provider<R, T> {
  #optionalProvider: OptionalProviderFn<R, T>;
  #defaultValueProvider: ProviderFn<R, T>;

  constructor(opts: DefaultProviderOptions<R, T>) {
    if (!opts.defaultValue && !opts.defaultValueProvider) {
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

  static wrap<R, T = void>(
    provider: OptionalProviderComponent<R, T>,
    defaultValue?: R,
  ): Provider<R, T> {
    return new DefaultProvider<R, T>({ provider, defaultValue });
  }

  async get(arg: T): Promise<R> {
    let result = await this.#optionalProvider(arg);
    result ??= await this.#defaultValueProvider(arg);

    return result!;
  }
}
