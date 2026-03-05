import {
  Predicate,
  PredicateComponent,
  PredicateFn,
} from '../types/predicate.js';
import { getComponent } from '../get-component.js';

// Technically this could be implemented by wrapping an AnyPredicate
// with a NegatedPredicate, but I guarantee that I would eventually
// wrap an AllPredicate in a NegatedPredicate by mistake and then have
// to go back and change it, so here we are.

/**
 * Options for creating a NonePredicate.
 *
 * @template T - The type of the value to test.
 */
export type NonePredicateOptions<T> = {
  /** The constituent predicates to combine. */
  predicates: PredicateComponent<T>[];
};

/**
 * A composite predicate that returns true if none of the
 * constituent predicates return true.
 *
 * @template T - The type of the value to test. Defaults to void,
 * allowing for predicates that do not require an input value.
 */
export class NonePredicate<T = void> implements Predicate<T> {
  #predicates: PredicateFn<T>[];

  constructor(opts: NonePredicateOptions<T>) {
    this.#predicates = opts.predicates.map(p => getComponent(p, 'test'));
  }

  /**
   * Wraps an array of predicate components into a NonePredicate.
   *
   * @template T - The type of the value to test.
   * @param predicates - The predicate components to combine.
   * @returns An instance of NonePredicate.
   */
  static wrap<T>(...predicates: PredicateComponent<T>[]): NonePredicate<T> {
    return new NonePredicate<T>({ predicates: [predicates].flat() });
  }

  /**
   * Tests the value against all constituent predicates and returns true if
   * none of the predicates return true.
   *
   * @param value - The value to test.
   * @returns A promise that resolves to the boolean result of the test.
   */
  async test(value: T): Promise<boolean> {
    for (const predicateFn of this.#predicates) {
      const result = await predicateFn(value);
      if (result) {
        return false;
      }
    }

    return true;
  }
}
