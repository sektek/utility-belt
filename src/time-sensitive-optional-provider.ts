import {
  OptionalProviderComponent,
  OptionalProviderFn,
} from './types/optional-provider.js';
import { getComponent } from './get-component.js';

export type TimeSensitiveOptionalProviderOptions<T, K = string> = {
  provider: OptionalProviderComponent<T, K>;
  timeout: number;
};

/**
 * A wrapper for an OptionalProvider that adds a timeout feature and returns
 * undefined if the provider does not return a value within the specified timeout.
 * @template T - The type of the value returned by the provider.
 * @template K - The type of the key used to access the provider.
 *               If not provided, the provider does not expect a key.
 */
export class TimeSensitiveOptionalProvider<T, K = string> {
  #provider: OptionalProviderFn<T, K>;
  #timeout: number;
  #timeoutProvider: OptionalProviderFn<T, K>;

  constructor(opts: TimeSensitiveOptionalProviderOptions<T, K>) {
    this.#provider = getComponent(opts.provider, 'get');
    this.#timeout = opts.timeout;
    this.#timeoutProvider = () =>
      new Promise<T | undefined>(resolve =>
        setTimeout(() => resolve(undefined), this.#timeout),
      );
  }

  async get(key: K): Promise<T | undefined> {
    return await Promise.race([this.#provider(key), this.#timeoutProvider()]);
  }
}
