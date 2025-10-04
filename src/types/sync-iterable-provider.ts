import { Component } from '../types/component.js';

/**
 * A provider that returns a synchronous iterable of values.
 *
 * @template R The type of values provided by the iterable.
 * @template T The type of argument accepted by the provider function.
 *             If not provided, the provider does not expect an argument.
 */
export type SyncIterableProviderFn<R, T = unknown> = (arg: T) => Iterable<R>;

/**
 * An interface allowing for a class based synchronous iterable provider.
 * Note that the use of the method name `values` is intentional, to
 * allow for an array, set, or map to be used as a synchronous iterable provider.
 *
 * @template R The type of values provided by the iterable.
 * @template T The type of argument accepted by the provider function.
 *             If not provided, the provider does not expect an argument.
 */
export interface SyncIterableProvider<R, T = unknown> {
  values: SyncIterableProviderFn<R, T>;
}

export type SyncIterableProviderComponent<R, T = unknown> = Component<
  SyncIterableProvider<R, T>,
  'values'
>;
