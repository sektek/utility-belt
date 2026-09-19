import {
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '../types/index.js';
import { getComponent } from '../get-component.js';

/**
 * Options for creating a ChainedOptionalProvider.
 *
 * @template T - The type of the value returned by the provider.
 */
type ChainedOptionalProviderOpts<T> = {
  /**
   * An array of optional providers to be chained together.
   * The providers will be queried in order until one returns a defined value.
   */
  providers: OptionalProviderComponent<T>[];
};

/**
 * An optional provider that queries a list of optional providers in order,
 * returning the first defined value. Resolves to `undefined` if every
 * provider does.
 *
 * @template T - The type of the value returned by the provider.
 */
export class ChainedOptionalProvider<T> implements OptionalProvider<T> {
  #providers: OptionalProviderFn<T>[];

  constructor(opts: ChainedOptionalProviderOpts<T>) {
    this.#providers = opts.providers.map(p => getComponent(p, 'get'));
  }

  /**
   * Queries the chained providers in order, returning the first defined
   * value.
   *
   * @returns The first defined value from the chained providers, or
   *   `undefined` if none produced one.
   */
  async get() {
    for (const provider of this.#providers) {
      const value = await provider();
      if (value !== undefined) {
        return value;
      }
    }

    return undefined;
  }
}
