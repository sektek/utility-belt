import { Stoppable } from '../types/stoppable.js';

import { isFunction } from './is-function.js';

/**
 * Type guard that returns `true` if `value` implements the `Stoppable` interface,
 * i.e. has `stop`, `on` and `emit` methods of type `Function`.
 *
 * @param value - The value to test.
 * @returns `true` if `value` has `stop`, `on` and `emit` methods of type `Function`, `false` otherwise.
 */
export const isStoppable = (value: unknown): value is Stoppable =>
  !!value &&
  typeof value === 'object' &&
  isFunction((value as Stoppable).stop) &&
  isFunction((value as Stoppable).on) &&
  isFunction((value as Stoppable).emit);
