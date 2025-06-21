import { Provider, ProviderFn } from './provider.js';
import { Component } from './component.js';

/**
 * A provider that may return an undefined value.
 * It may expect an argument or not. It may be asynchronous, returning a
 * Promise that resolves to the value.
 * @param R - The type of the value returned by the provider.
 * @param T - The type of the argument passed to the provider.
 *            If not provided, the provider does not expect an argument.
 */
export type OptionalProviderFn<R, T = void> = ProviderFn<R | undefined, T>;

/**
 * An interface allowing for a class based optional provider
 * providing a `get` method that may return an undefined value.
 * It may expect an argument or not. It may be asynchronous, returning a
 * Promise that resolves to the value.
 * @param R - The type of the value returned by the provider.
 * @param T - The type of the argument passed to the provider.
 *            If not provided, the provider does not expect an argument.
 */
export interface OptionalProvider<R, T = void>
  extends Provider<R | undefined, T> {
  get: OptionalProviderFn<R, T>;
}

/**
 * A component type for an optional provider, allowing to extract the
 * `get` method as a function type.
 * @param R - The type of the value returned by the provider.
 * @param T - The type of the argument passed to the provider.
 *            If not provided, the provider does not expect an argument.
 */
export type OptionalProviderComponent<R, T> = Component<
  OptionalProvider<R, T>,
  'get'
>;
