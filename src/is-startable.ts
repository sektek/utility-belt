import { Startable } from './types/startable.js';

/**
 * Type guard that returns `true` if `value` implements the `Startable` interface,
 * i.e. has a `start` method of type `Function`.
 *
 * @param value - The value to test.
 * @returns `true` if `value` has a `start` method of type `Function`, `false` otherwise.
 */
export const isStartable = (value: unknown): value is Startable =>
  !!value &&
  typeof value === 'object' &&
  'start' in value &&
  typeof (value as Startable).start === 'function';
