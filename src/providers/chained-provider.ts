import { OptionalProviderComponent } from '../types/index.js';

import {
  FallbackProvider,
  FallbackProviderOptions,
} from './fallback-provider.js';
import { ChainedOptionalProvider } from './chained-optional-provider.js';

/**
 * Options for creating a ChainedProvider.
 *
 * @template T - The type of the context used by the providers.
 */
type ChainedProviderOpts<T> = Omit<FallbackProviderOptions<T>, 'provider'> & {
  /**
   * An array of OptionalProviderComponents to be chained together.
   * The providers will be queried in order until one returns a defined value.
   */
  providers: OptionalProviderComponent<T>[];
};

export class ChainedProvider<T> extends FallbackProvider<T> {
  constructor(opts: ChainedProviderOpts<T>) {
    const chainedOptionalProvider = new ChainedOptionalProvider({
      providers: opts.providers,
    });
    super({
      ...opts,
      provider: chainedOptionalProvider,
    });
  }
}
