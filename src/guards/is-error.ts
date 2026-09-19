/**
 * Type guard that returns `true` if `value` is an `Error` instance.
 *
 * @param value - The value to test.
 * @returns `true` if `value` is an `Error` instance, `false` otherwise.
 */
export const isError = (value: unknown): value is Error =>
  value instanceof Error;
