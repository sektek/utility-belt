import { ProcessorComponent, ProcessorFn } from './types/processor.js';
import { ProviderComponent, ProviderFn } from './types/provider.js';
import { getComponent } from './get-component.js';

export type ProcessingProviderOptions<I, O = I, T = void> = {
  provider: ProviderComponent<I, T>;
  processor: ProcessorComponent<I, O>;
};

/**
 * A ProcessingProvider combines a Provider whose return value is run through a Processor
 * before being returned. Useful for transforming or enriching data before use.
 *
 * @template I - The type of the input value provided by the Provider.
 * @template O - The type of the output value after processing.
 * @template T - The type of the context used by the Provider.
 */
export class ProcessingProvider<I, O = I, T = void> {
  #provider: ProviderFn<I, T>;
  #processor: ProcessorFn<I, O>;

  constructor(opts: ProcessingProviderOptions<I, O, T>) {
    this.#provider = getComponent(opts.provider, 'get');
    this.#processor = getComponent(opts.processor, 'process');
  }

  async provide(context: T): Promise<O> {
    const input = await this.#provider(context);
    return this.#processor(input);
  }
}
