import { Component } from './component.js';

/**
 * SyncPredicateFn is a function type that defines how to test a value.
 * It returns true if the value matches the predicate, false otherwise.
 *
 * This is intended for situations where only synchronous evaluation is possible,
 * such as in synchronous loops or within constructors.
 * @typeParam T - The type of the value to be tested.
 * @returns boolean - The return type is a boolean indicating whether the
 *                    value matches the predicate.
 *
 * @see {@link Predicate}
 */
export type SyncPredicateFn<T> = (value: T) => boolean;

/** An interface allowing for a class based predicate */
export interface SyncPredicate<T> {
  test: SyncPredicateFn<T>;
}

export type SyncPredicateComponent<T> = Component<SyncPredicate<T>, 'test'>;
