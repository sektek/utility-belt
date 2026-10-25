import {
  IterableProvider,
  IterableProviderComponent,
  IterableProviderFn,
} from '../types/iterable-provider.js';
import { PredicateComponent, PredicateFn } from '../types/predicate.js';
import { ProviderComponent, ProviderFn } from '../types/provider.js';
import { getComponent } from '../get-component.js';

/**
 * Options for a {@link FilteringIterableProvider}. Exactly one of `predicate`
 * or `predicateProvider` must be given.
 *
 * @template R - The type of the values provided by the wrapped provider.
 * @template T - The type of the context used by the wrapped provider and the
 *   predicate provider.
 */
export type FilteringIterableProviderOptions<R, T = void> = {
  /** The IterableProvider whose values are filtered. */
  provider: IterableProviderComponent<R, T>;
} & (
  | {
      /** The Predicate every value must satisfy to be provided. */
      predicate: PredicateComponent<R>;
      predicateProvider?: never;
    }
  | {
      predicate?: never;
      /**
       * A Provider of the Predicate to apply. It is called with the context
       * once per `values()` call.
       */
      predicateProvider: ProviderComponent<PredicateComponent<R>, T>;
    }
);

/**
 * A FilteringIterableProvider combines an IterableProvider with a Predicate.
 * Only the values of the wrapped provider's iterable that satisfy the
 * Predicate are provided. Values are tested lazily and in order. The
 * Predicate is either fixed or provided per call from the context.
 *
 * @template R - The type of the values provided by the wrapped provider.
 * @template T - The type of the context used by the wrapped provider and the
 *   predicate provider.
 */
export class FilteringIterableProvider<R, T = void> implements IterableProvider<
  R,
  T
> {
  #provider: IterableProviderFn<R, T>;
  #resolvePredicate: (context: T) => PredicateFn<R> | Promise<PredicateFn<R>>;

  /**
   * @param opts - The wrapped provider and the predicate or predicate provider.
   *
   * @throws {Error} If neither or both of `predicate` and `predicateProvider`
   *   are given.
   */
  constructor(opts: FilteringIterableProviderOptions<R, T>) {
    this.#provider = getComponent(opts.provider, 'values');

    if (opts.predicate !== undefined && opts.predicateProvider !== undefined) {
      throw new Error('Only one of predicate or predicateProvider is allowed');
    }

    if (opts.predicate !== undefined) {
      const predicate: PredicateFn<R> = getComponent(opts.predicate, 'test');
      this.#resolvePredicate = () => predicate;
    } else if (opts.predicateProvider !== undefined) {
      const predicateProvider: ProviderFn<
        PredicateComponent<R>,
        T
      > = getComponent(opts.predicateProvider, 'get');
      this.#resolvePredicate = async context => {
        const predicate: PredicateFn<R> = getComponent(
          await predicateProvider(context),
          'test',
        );

        return predicate;
      };
    } else {
      throw new Error('Either predicate or predicateProvider is required');
    }
  }

  /**
   * Provides the values of the wrapped provider that satisfy the predicate.
   * Nothing is requested from the wrapped provider or tested until the
   * returned iterable is consumed. The predicate is resolved once per call.
   * Errors from the provider, the predicate provider or the predicate reject
   * the iteration and end it.
   *
   * @param context - The context passed to the wrapped provider and the
   *   predicate provider.
   * @yields {Awaited<R>} The values that pass the predicate, in order.
   */
  async *values(context: T): AsyncGenerator<Awaited<R>, void, undefined> {
    const predicate = await this.#resolvePredicate(context);
    const iterable = await this.#provider(context);

    for await (const value of iterable) {
      if (await predicate(value)) {
        yield value;
      }
    }
  }
}
