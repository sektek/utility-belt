import { IterableProviderFn } from './iterable-provider.js';
import { MutatorFn } from './mutator.js';
import { OptionalProviderFn } from './optional-provider.js';
import { PredicateFn } from './predicate.js';

/**
 * Interface definition for a generic store interface.
 * This interface defines the basic operations that a store should support,
 * including getting, setting, deleting, checking existence, and clearing items.
 * All keys are expected to be strings.
 *
 * @typeParam T - The type of the value stored in the store.
 * @typeParam K - The type of the key used to access the store. Defaults to string.
 */
export interface Store<T, K = string> {
  /**
   * Retrieves a value from the store by its key.
   * @param key - The key to retrieve the value for.
   * @returns A promise that resolves to the value associated with the key,
   *          or undefined if the key does not exist in the store.
   */
  get: OptionalProviderFn<T, K>;

  /**
   * Retrieves all keys from the store.
   * @returns A promise that resolves to an iterable of all keys in the store.
   */
  keys: IterableProviderFn<K>;

  /**
   * Retrieves all values from the store.
   * @returns A promise that resolves to an iterable of all values in the store.
   */
  values: IterableProviderFn<T>;

  /**
   * Sets a value in the store for a given key.
   * @param key - The key to set the value for.
   * @param value - The value to be stored.
   * @returns A promise that resolves to the stored value.
   */
  set: MutatorFn<T, K>;

  /**
   * Deletes a value from the store by its key.
   * @param key - The key to delete the value for.
   * @returns A promise that resolves to true if the value was deleted,
   *          or false if the key did not exist in the store.
   */
  delete: (key: K) => PromiseLike<boolean> | boolean;

  /**
   * Checks if a value exists in the store for a given key.
   * @param key - The key to check for existence.
   * @returns A promise that resolves to true if the key exists, false otherwise.
   */
  has: PredicateFn<K>;

  /**
   * Clears all items from the store.
   * @returns A promise that resolves when the store has been cleared.
   */
  clear: () => PromiseLike<void> | void;
}
