import { ExecutableFn } from '../types/index.js';

/**
 * An execution strategy that runs functions serially, awaiting each one
 * before proceeding to the next. If any function throws an error,
 * execution stops and the error is propagated.
 */
export const serialExecutionStrategy = async <
  T extends ExecutableFn = ExecutableFn,
>(
  fns: Iterable<T> | AsyncIterable<T>,
  ...args: Parameters<T>
): Promise<void> => {
  for await (const fn of fns) {
    await fn(...args);
  }
};
