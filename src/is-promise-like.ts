import { isObject } from './is-object.js';

/**
 * Determines whether a value implements the {@link PromiseLike} contract.
 *
 * @param value - The value to inspect.
 * @returns `true` when the value is an object with a callable `then` member.
 */
export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  isObject(value) && typeof (value as { then?: unknown }).then === 'function';
