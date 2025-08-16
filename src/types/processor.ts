import { Component } from './component.js';

/**
 * A processor is a function that takes a value and returns a processed value.
 * It may be asynchronous, returning a Promise that resolves to the processed value.
 * @example
 * ```ts
 * const double: Processor<number> = (value) => value * 2;
 * ```
 */
export type ProcessorFn<T, R> = (value: T) => R | PromiseLike<R>;

/** An interface allowing for a class based processor */
export interface Processor<T, R> {
  process: ProcessorFn<T, R>;
}

export type ProcessorComponent<T, R> = Component<Processor<T, R>, 'process'>;
