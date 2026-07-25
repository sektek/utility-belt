import { Stoppable } from './types/stoppable.js';

/**
 * Type guard that returns `true` if `value` implements the `Stoppable` interface,
 * i.e. has a `stop` method of type `Function`.
 *
 * @param value - The value to test.
 * @returns `true` if `value` has a `stop` method of type `Function`, `false` otherwise.
 */
export const isStoppable = (value: unknown): value is Stoppable =>
  !!value &&
  typeof value === 'object' &&
  'stop' in value &&
  typeof (value as Stoppable).stop === 'function';
