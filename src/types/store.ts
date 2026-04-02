import { IterableProviderFn } from './iterable-provider.js';
import { MutatorFn } from './mutator.js';
import { PredicateFn } from './predicate.js';

type StoreProviderOptions<T> = {
  /**
   * An optional initial value to be stored if the key does not already exist
   * in the store. This can be used to provide a default value for a key when
   * it is accessed for the first time. If the key does not exist, the provided
   * value will be stored and undefined will be returned. If the key already
   * exists in the store, this initial value will be ignored.
   */
  initialValue?: T;
};
type StoreProviderFn<T, K> = (
  key: K,
  options?: StoreProviderOptions<T>,
) => PromiseLike<T | undefined> | T | undefined;

/**
 * Interface definition for a generic store interface.
 * This interface defines the basic operations that a store should support,
 * including getting, setting, deleting, checking existence, and clearing items.
 * All keys are expected to be strings.
 *
 * @template T - The type of the value stored in the store.
 * @template K - The type of the key used to access the store. Defaults to string.
 */
export interface Store<T, K = string> {
  /**
   * Retrieves a value from the store by its key.
   *
   * @param key - The key to retrieve the value for.
   * @param options - Optional parameters for the get operation,
   * such as an initial value to set if the key does not exist.
   * Note that if using a Map as the store, options will be ignored
   * as this is not supported by the Map interface.
   *
   * @returns A promise that resolves to the value associated with the key,
   *          or undefined if the key does not exist in the store.
   */
  get: StoreProviderFn<T, K>;

  /**
   * Retrieves all keys from the store.
   *
   * @returns A promise that resolves to an iterable of all keys in the store.
   */
  keys: IterableProviderFn<K>;

  /**
   * Retrieves all values from the store.
   *
   * @returns A promise that resolves to an iterable of all values in the store.
   */
  values: IterableProviderFn<T>;

  /**
   * Sets a value in the store for a given key.
   *
   * @param key - The key to set the value for.
   * @param value - The value to be stored.
   *
   * @returns A promise that resolves to the stored value.
   */
  set: MutatorFn<T, K>;

  /**
   * Deletes a value from the store by its key.
   *
   * @param key - The key to delete the value for.
   *
   * @returns A promise that resolves to true if the value was deleted,
   *          or false if the key did not exist in the store.
   */
  delete: (key: K) => PromiseLike<boolean> | boolean;

  /**
   * Checks if a value exists in the store for a given key.
   *
   * @param key - The key to check for existence.
   *
   * @returns A promise that resolves to true if the key exists, false otherwise.
   */
  has: PredicateFn<K>;

  /**
   * Clears all items from the store.
   *
   * @returns A promise that resolves when the store has been cleared.
   */
  clear: () => PromiseLike<void> | void;
}
