import { Named } from './types/index.js';

/**
 * Type guard that returns `true` if `value` implements the `Named` interface,
 * i.e. has a `name` property of type `string`.
 *
 * @param value - The value to test.
 * @returns `true` if `value` has a `name` property of type `string`, `false` otherwise.
 */
export const isNamed = (value: unknown): value is Named =>
  !!value &&
  typeof value === 'object' &&
  'name' in value &&
  typeof (value as Named).name === 'string';
