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

/**
 * A provider that queries a list of optional providers in order, returning
 * the first defined value, and falling back to a static or provided
 * default (per {@link FallbackProvider}) when every provider in the chain
 * returns `undefined`.
 *
 * @template T - The type of the value returned by the provider.
 */
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
