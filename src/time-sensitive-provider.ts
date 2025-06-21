import type { ProviderComponent, ProviderFn } from './types/provider.js';
import { getComponent } from './get-component.js';

export type TimeSensitiveProviderOptions<T, K = string> = {
  provider: ProviderComponent<T, K>;
  timeout: number;
};

/**
 * A wrapper for a provider that adds a timeout feature.
 * If the provider does not return a value within the specified timeout,
 * it will throw an error.
 * @template T - The type of the value returned by the provider.
 * @template K - The type of the key used to access the provider.
 *               If not provided, the provider does not expect a key.
 */
export class TimeSensitiveProvider<T, K = string> {
  #provider: ProviderFn<T, K>;
  #timeout: number;
  #timeoutProvider: ProviderFn<T, K>;

  constructor(opts: TimeSensitiveProviderOptions<T, K>) {
    this.#provider = getComponent(opts.provider, 'get');
    this.#timeout = opts.timeout;
    this.#timeoutProvider = () =>
      new Promise<T>((_resolve, reject) =>
        setTimeout(
          () => reject(new Error('Provider timed out')),
          this.#timeout,
        ),
      );
  }

  async get(key: K): Promise<T | undefined> {
    return await Promise.race([this.#provider(key), this.#timeoutProvider()]);
  }
}
