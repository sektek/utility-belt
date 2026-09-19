import {
  OptionalProviderComponent,
  OptionalProviderFn,
  Predicate,
  PredicateComponent,
  PredicateFn,
} from '../types/index.js';
import { getComponent } from '../get-component.js';

import { reject } from './reject-predicate.js';

/**
 * Options for creating a DelegatingPredicate.
 *
 * @template T - The type of the value to test.
 */
type DelegatingPredicateOptions<T = void> = {
  /** Selects the key used to choose which delegate predicate to invoke. */
  selector: OptionalProviderComponent<string, T>;
  /** A map of keys to predicate components. */
  delegates: Record<string, PredicateComponent<T>>;
  /**
   * The predicate component used when the selected key has no matching
   * delegate, or when the selector returns `undefined`. Defaults to
   * {@link reject}.
   */
  default?: PredicateComponent<T>;
};

/**
 * A predicate that delegates to one of several predicate components, chosen
 * by a selector evaluated against the value being tested.
 *
 * @template T - The type of the value to test.
 */
export class DelegatingPredicate<T = void> implements Predicate<T> {
  #selector: OptionalProviderFn<string, T>;
  #delegateMap: Map<string, PredicateFn<T>>;
  #defaultDelegate: PredicateFn<T>;

  constructor(options: DelegatingPredicateOptions<T>) {
    this.#selector = getComponent(options.selector, 'get');
    this.#delegateMap = new Map(
      Object.entries(options.delegates).map(([key, component]) => [
        key,
        getComponent(component, 'test'),
      ]),
    );
    this.#defaultDelegate = getComponent(options.default ?? reject, 'test');
  }

  /**
   * Selects a key via the selector, then invokes the matching delegate
   * predicate (or the default delegate, when the key has no match).
   *
   * @param context - The value to test, passed to both the selector and
   *   the resolved delegate.
   * @returns A promise that resolves to the result of the resolved
   *   delegate predicate.
   */
  async test(context: T): Promise<boolean> {
    const key = await this.#selector(context);
    const delegate =
      key != null
        ? (this.#delegateMap.get(key) ?? this.#defaultDelegate)
        : this.#defaultDelegate;

    return await delegate(context);
  }
}
