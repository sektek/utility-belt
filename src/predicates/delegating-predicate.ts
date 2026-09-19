import {
  OptionalProviderComponent,
  OptionalProviderFn,
  Predicate,
  PredicateComponent,
  PredicateFn,
} from '../types/index.js';
import { getComponent } from '../get-component.js';

import { reject } from './reject-predicate.js';

type DelegatingPredicateOptions<T = void> = {
  selector: OptionalProviderComponent<string, T>;
  delegates: Record<string, PredicateComponent<T>>;
  default?: PredicateComponent<T>;
};

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

  async test(context: T): Promise<boolean> {
    const key = await this.#selector(context);
    const delegate =
      key != null
        ? (this.#delegateMap.get(key) ?? this.#defaultDelegate)
        : this.#defaultDelegate;
    return await delegate(context);
  }
}
