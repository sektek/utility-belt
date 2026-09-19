import {
  OptionalProviderComponent,
  OptionalProviderFn,
  Provider,
  ProviderComponent,
  ProviderFn,
} from '../types/index.js';
import { getComponent } from '../get-component.js';

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
export class DelegatingProvider<R, T = void> implements Provider<R, T> {
  #selector: OptionalProviderFn<string, T>;
  #delegateMap: Map<string, ProviderFn<R, T>>;
  #defaultDelegate: ProviderFn<R, T>;

  constructor(options: DelegatingProviderOptions<R, T>) {
    this.#selector = getComponent(options.selector, 'get');
    this.#delegateMap = new Map(
      Object.entries(options.delegates).map(([key, component]) => [
        key,
        getComponent(component, 'get'),
      ]),
    );
    this.#defaultDelegate = getComponent(options.default, 'get');
  }

  /**
   * Selects a key via the selector, then invokes the matching delegate
   * provider (or the default delegate, when the key has no match).
   *
   * @param context - The argument to pass to the selector and delegate.
   * @returns The value returned by the resolved delegate provider.
   */
  async get(context: T): Promise<R> {
    const key = await this.#selector(context);
    const delegate =
      key != null
        ? (this.#delegateMap.get(key) ?? this.#defaultDelegate)
        : this.#defaultDelegate;
    return await delegate(context);
  }
}
