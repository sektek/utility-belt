import {
  OptionalProviderComponent,
  OptionalProviderFn,
} from './types/optional-provider.js';
import { Provider, ProviderFn } from './types/provider.js';
import { getComponent } from './get-component.js';

/**
 * wrapOptionalProvider is a utility function that wraps an optional provider
 * component and returns a function that can be used to get a value from the
 * provider. If the provider returns undefined, it will return a default
 * value if provided, or throw an error if no default value is specified.
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *                If not provided, the provider does not expect an argument.
 */
export const wrapOptionalProvider = <R, T = void>(
  provider: OptionalProviderComponent<R, T>,
  defaultValue?: R,
): ProviderFn<R, T> => {
  const providerFn: OptionalProviderFn<R, T> = getComponent(provider, 'get');
  return async (arg: T): Promise<R> => {
    const result = await providerFn(arg);
    if (result === undefined && defaultValue === undefined) {
      throw new Error('Provider returned undefined');
    }

    return (result ?? defaultValue) as R;
  };
};

/**
 * Options for the ProviderWrapper constructor.
 */
export type ProviderWrapperOptions<R, T = void> = {
  /** The provider component that will be wrapped. */
  provider: OptionalProviderComponent<R, T>;
  /**
   * An optional default value to return if the provider returns undefined.
   * If not provided, an error will be thrown if the provider returns undefined.
   */
  defaultValue?: R;
  defaultValueProvider?: OptionalProviderComponent<R, T>;
};

/**
 * ProviderWrapper is a class that wraps an optional provider component.
 * It provides a method to get a value from the provider, returning a default value
 * if the provider returns undefined.
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *                If not provided, the provider does not expect an argument.
 */
export class ProviderWrapper<R, T = void> implements Provider<R, T> {
  #optionalProvider: OptionalProviderFn<R, T>;
  #defaultValueProvider: OptionalProviderFn<R, T>;

  constructor(opts: ProviderWrapperOptions<R, T>) {
    this.#optionalProvider = getComponent(opts.provider, 'get');
    this.#defaultValueProvider = getComponent(
      opts.defaultValueProvider,
      'get',
      {
        default: () => opts.defaultValue ?? undefined,
      },
    );
  }

  static wrap<R, T = void>(
    provider: OptionalProviderComponent<R, T>,
    defaultValue?: R,
  ): Provider<R, T> {
    return new ProviderWrapper<R, T>({ provider, defaultValue });
  }

  async get(arg: T): Promise<R> {
    let result = await this.#optionalProvider(arg);
    result ??= await this.#defaultValueProvider(arg);

    if (result === undefined) {
      throw new Error('Provider returned undefined');
    }

    return result as R;
  }
}
