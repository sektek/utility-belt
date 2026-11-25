import {
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '../types/optional-provider.js';
import { PredicateComponent, PredicateFn } from '../types/predicate.js';
import { getComponent } from '../get-component.js';

/**
 * Options for a {@link ConditionalProvider}.
 *
 * @template R - The type of the value provided by the wrapped provider.
 * @template T - The type of the context passed to the predicate and the
 *   wrapped provider.
 */
export type ConditionalProviderOptions<R, T = void> = {
  /** The Provider or OptionalProvider consulted when the predicate passes. */
  provider: OptionalProviderComponent<R, T>;

  /** The Predicate deciding whether the wrapped provider is consulted. */
  predicate: PredicateComponent<T>;
};

/**
 * A ConditionalProvider consults a wrapped provider only when a predicate
 * accepts the context. When the predicate rejects it, the wrapped provider is
 * not called and `undefined` is provided.
 *
 * @template R - The type of the value provided by the wrapped provider.
 * @template T - The type of the context passed to the predicate and the
 *   wrapped provider.
 */
export class ConditionalProvider<R, T = void> implements OptionalProvider<
  R,
  T
> {
  #provider: OptionalProviderFn<R, T>;
  #predicate: PredicateFn<T>;

  /**
   * @param opts - The wrapped provider and the predicate guarding it.
   */
  constructor(opts: ConditionalProviderOptions<R, T>) {
    this.#provider = getComponent(opts.provider, 'get');
    this.#predicate = getComponent(opts.predicate, 'test');
  }

  /**
   * Provides the wrapped provider's value if the predicate accepts the
   * context.
   *
   * @param context - The context passed to the predicate and the provider.
   *
   * @returns The wrapped provider's value, or `undefined` if the predicate
   *   rejected the context or the provider provided no value.
   *
   * @throws {Error} Any error thrown by the predicate or the wrapped provider.
   */
  async get(context: T): Promise<R | undefined> {
    if (!(await this.#predicate(context))) {
      return undefined;
    }

    return this.#provider(context);
  }
}
