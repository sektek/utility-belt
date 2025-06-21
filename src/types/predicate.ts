import { Component } from './component.js';

/**
 * A predicate is a function that takes a value and returns a boolean.
 * It may be asynchronous, returning a Promise that resolves to a boolean.
 * @example
 * ```ts
 * const isEven: Predicate<number> = (value) => value % 2 === 0;
 * ```
 */
export type PredicateFn<T> = (value: T) => boolean | PromiseLike<boolean>;

/** An interface allowing for a class based predicate */
export interface Predicate<T> {
  test: PredicateFn<T>;
}

export type PredicateComponent<T> = Component<Predicate<T>, 'test'>;
