/**
 * Type definition for a generic store interface.
 * This interface defines the basic operations that a store should support,
 * including getting, setting, deleting, checking existence, and clearing items.
 * All keys are expected to be strings.
 *
 * @typeParam T - The type of the value stored in the store.
 */
export type Store<T> = {
  get: (key: string) => PromiseLike<T | undefined> | T | undefined;
  set: (key: string, value: T) => PromiseLike<unknown | void> | unknown | void;
  delete: (key: string) => PromiseLike<boolean> | boolean;
  has: (key: string) => PromiseLike<boolean> | boolean;
  clear: () => PromiseLike<void> | void;
};
