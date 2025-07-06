import { Component } from './component.js';

/**
 * SyncProviderFn is a function type that defines how to get a value synchronously.
 * It returns the value directly without any asynchronous operations.
 *
 * This is intended for situations where only synchronous evaluation is possible,
 * such as in synchronous loops or within constructors.
 * @typeParam R - The type of the value returned by the provider.
 * @typeParam T - The type of the argument passed to the provider.
 *                If not provided, the provider does not expect an argument.
 * @returns R - The return type is the value provided by the provider.
 */
export type SyncProviderFn<R, T = unknown> = (arg: T | void) => R;

/** An interface allowing for class based synchronous provider */
export interface SyncProvider<R, T = unknown> {
  get: SyncProviderFn<R, T>;
}

export type SyncProviderComponent<R, T = unknown> = Component<
  SyncProvider<R, T>,
  'get'
>;
