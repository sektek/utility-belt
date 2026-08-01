/**
 * Determines whether a value can be used as an object, including functions.
 *
 * @param value - The value to inspect.
 * @returns `true` when the value is a non-null object or function.
 */
export const isObject = (value: unknown): value is object =>
  (typeof value === 'object' && value !== null) || typeof value === 'function';
