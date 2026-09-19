import {
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '../types/index.js';
import { getComponent } from '../get-component.js';

/**
 * Options for creating a DelegatingOptionalProvider.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 */
export type DelegatingOptionalProviderOptions<R, T = void> = {
  /** Selects the key used to choose which delegate provider to invoke. */
  selector: OptionalProviderComponent<string, T>;
  /** A map of keys to optional provider components. */
  delegates: Record<string, OptionalProviderComponent<R, T>>;
  /**
   * The optional provider component used when the selected key has no
   * matching delegate, or when the selector returns `undefined`. Defaults
   * to a provider that resolves to `undefined`.
   */
  default?: OptionalProviderComponent<R, T>;
};

/**
 * A provider that delegates to one of several optional provider components,
 * chosen by a selector evaluated against the provided context. Unlike
 * {@link DelegatingProvider}, a value need not be resolved: when no
 * delegate matches (and no default is supplied), it resolves to `undefined`.
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 */
export class DelegatingOptionalProvider<
  R,
  T = void,
> implements OptionalProvider<R, T> {
  #selector: OptionalProviderFn<string, T>;
  #delegateMap: Map<string, OptionalProviderFn<R, T>>;
  #defaultDelegate: OptionalProviderFn<R, T>;

  constructor(options: DelegatingOptionalProviderOptions<R, T>) {
    this.#selector = getComponent(options.selector, 'get');
    this.#delegateMap = new Map(
      Object.entries(options.delegates).map(([key, component]) => [
        key,
        getComponent(component, 'get'),
      ]),
    );
    this.#defaultDelegate = getComponent(
      options.default ?? (() => undefined),
      'get',
    );
  }

  /**
   * Selects a key via the selector, then invokes the matching delegate
   * provider (or the default delegate, when the key has no match).
   *
   * @param context - The argument to pass to the selector and delegate.
   * @returns The value returned by the resolved delegate provider, or
   *   `undefined` if no delegate or default resolved a value.
   */
  async get(context: T): Promise<R | undefined> {
    const key = await this.#selector(context);
    const delegate =
      key != null
        ? (this.#delegateMap.get(key) ?? this.#defaultDelegate)
        : this.#defaultDelegate;
    return await delegate(context);
  }
}
