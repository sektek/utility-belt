import {
  OptionalProviderComponent,
  ProviderComponent,
} from '../types/index.js';

import { DelegatingOptionalProvider } from './delegating-optional-provider.js';
import { FallbackProvider } from './fallback-provider.js';

/**
 * Options for creating a DelegatingProvider.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 */
export type DelegatingProviderOptions<R, T = void> = {
  /** Selects the key used to choose which delegate provider to invoke. */
  selector: OptionalProviderComponent<string, T>;
  /** A map of keys to provider components. */
  delegates: Record<string, ProviderComponent<R, T>>;
  /**
   * The provider component used when the selected key has no matching
   * delegate, or when the selector returns `undefined`. Required, since a
   * {@link Provider} must always resolve to a value.
   */
  default: ProviderComponent<R, T>;
};

/**
 * A provider that delegates to one of several provider components, chosen
 * by a selector evaluated against the provided context.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 */
export class DelegatingProvider<R, T = void> extends FallbackProvider<R, T> {
  constructor(options: DelegatingProviderOptions<R, T>) {
    const delegatingOptionalProvider = new DelegatingOptionalProvider<R, T>({
      selector: options.selector,
      delegates: options.delegates,
    });

    super({
      provider: delegatingOptionalProvider,
      defaultValueProvider: options.default,
    });
  }
}
