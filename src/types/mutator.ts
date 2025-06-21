import { Component } from './component.js';

/**
 * MutatorFn is a function type that defines how to mutate a value.
 * This is typically used to set or update values in a store.
 * @typeParam T - The type of the value to be mutated.
 * @typeParam K - The type of the key used to access the store. Defaults to string.
 * @returns <PromiseLike<unknown | void>> - The return type can be anything,
 *                                          or void if no return is needed.
 */
export type MutatorFn<T, K = string> = (
  key: K,
  value: T,
) => unknown | void | PromiseLike<unknown | void>;

/** An interface allowing for a class based Mutator */
export interface Mutator<T, K = string> {
  set: MutatorFn<T, K>;
}

export type MutatorComponent<T, K = string> = Component<Mutator<T, K>, 'set'>;
