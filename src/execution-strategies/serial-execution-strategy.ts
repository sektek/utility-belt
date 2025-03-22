import { ExecutableFn } from '../types/index.js';

export const serialExecutionStrategy = async <
  T extends ExecutableFn = ExecutableFn,
>(
  fns: T | T[],
  ...args: Parameters<T>
) => {
  const executables = [fns].flat();
  for (const fn of executables) {
    await fn(...args);
  }
};
