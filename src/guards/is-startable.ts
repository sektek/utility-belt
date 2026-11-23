import { Startable } from '../types/startable.js';

import { isFunction } from './is-function.js';

/**
 * Type guard that returns `true` if `value` implements the `Startable` interface,
 * i.e. has `start`, `on` and `emit` methods of type `Function`.
 *
 * @param value - The value to test.
 * @returns `true` if `value` has `start`, `on` and `emit` methods of type `Function`, `false` otherwise.
 */
export const isStartable = (value: unknown): value is Startable =>
  !!value &&
  typeof value === 'object' &&
  isFunction((value as Startable).start) &&
  isFunction((value as Startable).on) &&
  isFunction((value as Startable).emit);
