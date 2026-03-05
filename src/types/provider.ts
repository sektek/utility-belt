import { Component } from './component.js';

/**
 * A provider is a function that returns a value. It may expect an argument
 * or not. It may be asynchronous, returning a Promise that resolves to the
 * value.
 *
 * @example
 * ```ts
 * const getValue: Provider<number> = () => 42;
 * const getValueWithArg: Provider<number, string> = (arg) => arg.length;
 * ```
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *   If not provided, the provider does not expect an argument.
 */
export type ProviderFn<R, T = void> = (arg: T) => R | PromiseLike<R>;

/**
 * An interface allowing for a class based provider
 *
 * @template R - The type of the value returned by the provider.
 * @template T - The type of the argument passed to the provider.
 *   If not provided, the provider does not expect an argument.
 */
export interface Provider<R, T = void> {
  /**
   * A function that returns a value or a promise that resolves to a value.
   *
   * @param arg - The argument to pass to the provider function.
   *
   * @returns The value or a promise that resolves to the value.
   */
  get: ProviderFn<R, T>;
}

export type ProviderComponent<R, T = void> = Component<Provider<R, T>, 'get'>;
