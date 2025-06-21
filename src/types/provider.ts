import { Component } from './component.js';

/**
 * A provider is a function that returns a value. It may expect an argument
 * or not. It may be asynchronous, returning a Promise that resolves to the
 * value.
 * @example
 * ```ts
 * const getValue: Provider<number> = () => 42;
 * const getValueWithArg: Provider<number, string> = (arg) => arg.length;
 * ```
 * @param R - The type of the value returned by the provider.
 * @param T - The type of the argument passed to the provider.
 *            If not provided, the provider does not expect an argument.
 */
export type ProviderFn<R, T = void> = (arg: T | void) => R | PromiseLike<R>;

/** An interface allowing for a class based provider */
export interface Provider<R, T = void> {
  get: ProviderFn<R, T>;
}

export type ProviderComponent<R, T = void> = Component<Provider<R, T>, 'get'>;
