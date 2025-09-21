import { Component } from './component.js';

/**
 * A provider that returns an iterable or async iterable of values.
 *
 * @template R The type of values provided by the iterable.
 * @template T The type of argument accepted by the provider function.
 *             If not provided, the provider does not expect an argument.
 */
export type IterableProviderFn<R, T = unknown> = (
  arg: T,
) => Iterable<R> | AsyncIterable<R>;

/**
 * An interface allowing for a class based iterable provider.
 * Note that the use of the method name `values` is intentional, to
 * allow for an array, set, or map to be used as an iterable provider.
 *
 * @template R The type of values provided by the iterable.
 * @template T The type of argument accepted by the provider function.
 *             If not provided, the provider does not expect an argument.
 */
export interface IterableProvider<R, T = unknown> {
  values: IterableProviderFn<R, T>;
}

export type IterableProviderComponent<R, T = unknown> = Component<
  IterableProvider<R, T>,
  'values'
>;
