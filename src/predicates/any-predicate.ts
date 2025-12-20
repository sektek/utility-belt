import {
  Predicate,
  PredicateComponent,
  PredicateFn,
} from '../types/predicate.js';
import { getComponent } from '../get-component.js';

/**
 * Options for creating an AnyPredicate.
 * @template T - The type of the value to test.
 */
export type AnyPredicateOptions<T> = {
  /** The constituent predicates to combine. */
  predicates: PredicateComponent<T>[];
};

/**
 * A composite predicate that returns true if any
 * constituent predicates return true.
 * @template T - The type of the value to test. Defaults to void,
 * allowing for predicates that do not require an input value.
 */
export class AnyPredicate<T = void> implements Predicate<T> {
  #predicates: PredicateFn<T>[];

  constructor(opts: AnyPredicateOptions<T>) {
    this.#predicates = opts.predicates.map(p => getComponent(p, 'test'));
  }

  /**
   * Wraps an array of predicate components into an AnyPredicate.
   * @template T - The type of the value to test.
   * @param predicates - The predicate components to combine.
   * @returns An instance of AnyPredicate.
   */
  static wrap<T>(...predicates: PredicateComponent<T>[]): AnyPredicate<T> {
    return new AnyPredicate<T>({ predicates: [predicates].flat() });
  }

  async test(value: T): Promise<boolean> {
    for (const predicateFn of this.#predicates) {
      const result = await predicateFn(value);
      if (result) {
        return true;
      }
    }

    return false;
  }
}
