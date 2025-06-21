import { Predicate, PredicateComponent, PredicateFn } from './types/index.js';
import { getComponent } from './get-component.js';

/**
 * Negates a predicate function or component.
 * @param predicate A predicate function or component to negate.
 * @returns A new predicate function that returns the negation of the original predicate.
 */
export const negate = <T>(predicate: PredicateComponent<T>): PredicateFn<T> => {
  const predicateFn: PredicateFn<T> = getComponent(predicate, 'test');
  return (value: T): boolean => !predicateFn(value);
};

export type NegatedPredicateOptions<T> = {
  predicate: PredicateComponent<T>;
};

/**
 * A class that wraps a predicate component and negates its result.
 * @template T - The type of the value to test.
 */
export class NegatedPredicate<T> implements Predicate<T> {
  #predicateFn: PredicateFn<T>;

  constructor(opts: NegatedPredicateOptions<T>) {
    this.#predicateFn = getComponent(opts.predicate, 'test');
  }

  static wrap<T>(predicate: PredicateComponent<T>): NegatedPredicate<T> {
    return new NegatedPredicate<T>({ predicate });
  }

  test(value: T): boolean | PromiseLike<boolean> {
    return !this.#predicateFn(value);
  }
}
