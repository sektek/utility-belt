import { Component } from './component.js';

/**
 * A function that collects an item of type T.
 *
 * @template T The type of item to be collected.
 */
export type CollectorFn<T> = (item: T) => void | PromiseLike<void>;

/**
 * An interface allowing for a class based collector.
 * Note that the use of the method name `add` is intentional, to
 * allow for a set to be used as a collector. Unfortunately, a
 * wrapper is required for an array, as its interface is incompatible.
 *
 * @template T The type of item to be collected.
 */
export interface Collector<T> {
  add: CollectorFn<T>;
}

export type CollectorComponent<T> = Component<Collector<T>, 'add'>;
