import {
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '../types/index.js';
import { getComponent } from '../get-component.js';

type ChainedOptionalProviderOpts<T> = {
  /**
   * An array of optional providers to be chained together.
   * The providers will be queried in order until one returns a defined value.
   */
  providers: OptionalProviderComponent<T>[];
};

export class ChainedOptionalProvider<T> implements OptionalProvider<T> {
  #providers: OptionalProviderFn<T>[];

  constructor(opts: ChainedOptionalProviderOpts<T>) {
    this.#providers = opts.providers.map(p => getComponent(p, 'get'));
  }

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
