import { ProviderComponent, ProviderFn } from './types/index.js';
import { getComponent } from './get-component.js';

/**
 * Options for creating a SingletonProvider.
 *
 * @template T - The type of the value provided.
 */
export type SingletonProviderOptions<T> = {
  /** The provider component that creates the instance. */
  provider: ProviderComponent<T>;
};

/**
 * A provider that ensures only a single instance of the provided value is created.
 *
 * The first time `get()` is called, it invokes the underlying provider function
 * to create the instance. Subsequent calls to `get()` return the same instance
 * without invoking the provider function again.
 *
 * @template T - The type of the value provided.
 */
export class SingletonProvider<T> {
  #instance: T | undefined;
  #provider: ProviderFn<T>;
  #promise: PromiseLike<T> | T | undefined;

  constructor(opts: SingletonProviderOptions<T>) {
    this.#provider = getComponent(opts.provider, 'get');
  }

  /**
   * Wraps a provider component into a SingletonProvider.
   *
   * @param provider - The provider component that creates the instance.
   * @returns An instance of SingletonProvider.
   */
  static wrap<T>(provider: ProviderComponent<T>): SingletonProvider<T> {
    return new SingletonProvider({ provider });
  }

  async get(): Promise<T> {
    if (this.#instance !== undefined) {
      return this.#instance;
    }

    try {
      this.#promise ??= this.#provider();
      this.#instance = await this.#promise;
    } catch (error) {
      this.#instance = undefined;
      throw error;
    } finally {
      this.#promise = undefined;
    }

    return this.#instance as T;
  }

  async reset() {
    try {
      await this.#promise;
    } catch {
      // Ignore errors from the provider during reset
    } finally {
      this.#promise = undefined;
    }
    this.#instance = undefined;
  }
}

/**
 * Syntactic sugar for creating a SingletonProvider
 *
 * @param provider - The provider component that creates the instance.
 * @returns An instance of SingletonProvider.
 */
export const singleton = <T>(
  provider: ProviderComponent<T>,
): SingletonProvider<T> => SingletonProvider.wrap(provider);
