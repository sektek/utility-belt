import {
  IterableProvider,
  IterableProviderComponent,
  IterableProviderFn,
} from '../types/iterable-provider.js';
import { ProcessorComponent, ProcessorFn } from '../types/processor.js';
import { getComponent } from '../get-component.js';

/**
 * Options for a {@link ProcessingIterableProvider}.
 *
 * @template I - The type of the values provided by the wrapped provider.
 * @template O - The type of the values after processing.
 * @template T - The type of the context used by the wrapped provider.
 */
export type ProcessingIterableProviderOptions<I, O = I, T = void> = {
  /** The IterableProvider whose values are processed. */
  provider: IterableProviderComponent<I, T>;
  /** The Processor applied to each value provided. */
  processor: ProcessorComponent<I, O>;
};

/**
 * A ProcessingIterableProvider combines an IterableProvider with a Processor.
 * Each value of the wrapped provider's iterable is run through the Processor
 * as it is consumed. Values are processed lazily and in order.
 *
 * @template I - The type of the values provided by the wrapped provider.
 * @template O - The type of the values after processing.
 * @template T - The type of the context used by the wrapped provider.
 */
export class ProcessingIterableProvider<
  I,
  O = I,
  T = void,
> implements IterableProvider<O, T> {
  #provider: IterableProviderFn<I, T>;
  #processor: ProcessorFn<I, O>;

  constructor(opts: ProcessingIterableProviderOptions<I, O, T>) {
    this.#provider = getComponent(opts.provider, 'values');
    this.#processor = getComponent(opts.processor, 'process');
  }

  /**
   * Provides the processed values of the wrapped provider. Nothing is
   * requested from the wrapped provider or processed until the returned
   * iterable is consumed. Errors from the provider or the processor reject
   * the iteration and end it.
   *
   * @param context - The context passed to the wrapped provider.
   * @yields {Awaited<O>} The processed values, in order.
   */
  async *values(context: T): AsyncGenerator<Awaited<O>, void, undefined> {
    const iterable = await this.#provider(context);

    for await (const value of iterable) {
      yield await this.#processor(value);
    }
  }
}
