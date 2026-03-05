import { Component } from './component.js';

/**
 * A predicate is a function that takes a value and returns a boolean.
 * It may be asynchronous, returning a Promise that resolves to a boolean.
 *
 * @example
 * ```ts
 * const isEven: Predicate<number> = (value) => value % 2 === 0;
 * ```
 */
export type PredicateFn<T = void> = (
  value: T,
) => boolean | PromiseLike<boolean>;

/**
 * An interface allowing for a class based predicate
 *
 * @template T - The type of the value to test. Defaults to void, allowing for
 *   predicates that do not require an input value.
 *
 * @see {@link SyncPredicate}
 */
export interface Predicate<T = void> {
  /**
   * Tests whether the given value matches the predicate.
   *
   * @param value - The value to test against the predicate.
   *
   * @returns A boolean or a Promise that resolves to a boolean indicating
   *          whether the value matches the predicate.
   */
  test: PredicateFn<T>;
}

export type PredicateComponent<T = void> = Component<Predicate<T>, 'test'>;
