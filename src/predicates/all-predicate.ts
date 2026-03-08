import {
  Predicate,
  PredicateComponent,
  PredicateFn,
} from '../types/predicate.js';
import { getComponent } from '../get-component.js';

/**
 * Options for creating an AllPredicate.
 *
 * @template T - The type of the value to test.
 */
export type AllPredicateOptions<T> = {
  /** The constituent predicates to combine. */
  predicates: PredicateComponent<T>[];
};

/**
 * A composite predicate that returns true only if all
 * constituent predicates return true.
 *
 * @template T - The type of the value to test. Defaults to void,
 *   allowing for predicates that do not require an input value.
 */
export class AllPredicate<T = void> implements Predicate<T> {
  #predicates: PredicateFn<T>[];

  constructor(opts: AllPredicateOptions<T>) {
    this.#predicates = opts.predicates.map(p => getComponent(p, 'test'));
  }

  /**
   * Wraps an array of predicate components into an AllPredicate.
   *
   * @template T - The type of the value to test.
   * @param predicates - The predicate components to combine.
   *
   * @returns An instance of AllPredicate.
   */
  static wrap<T>(...predicates: PredicateComponent<T>[]): AllPredicate<T> {
    return new AllPredicate<T>({ predicates: [predicates].flat() });
  }

  /**
   * Tests the value against all constituent predicates.
   *
   * @param value - The value to test.
   *
   * @returns A promise that resolves to the boolean result of the test.
   */
  async test(value: T): Promise<boolean> {
    if (this.#predicates.length === 0) {
      return false;
    }

    for (const predicateFn of this.#predicates) {
      const result = await predicateFn(value);
      if (!result) {
        return false;
      }
    }

    return true;
  }
}

export const allOf = <T>(
  ...predicates: PredicateComponent<T>[]
): AllPredicate<T> => AllPredicate.wrap(...predicates);
