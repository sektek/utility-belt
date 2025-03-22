import { ExecutableFn } from '../types/index.js';
import { ExecutionError } from './execution-error.js';

export const parallelExecutionStrategy = async <
  T extends ExecutableFn = ExecutableFn,
>(
  fns: T | T[],
  ...args: Parameters<T>
) => {
  const executiables = [fns].flat();
  const results = await Promise.allSettled(executiables.map(fn => fn(...args)));

  const rejected = results.filter(
    result => result.status === 'rejected',
  ) as PromiseRejectedResult[];

  if (rejected.length) {
    if (rejected.length === 1) {
      throw rejected[0].reason;
    }
    throw new ExecutionError(rejected.map(result => result.reason));
  }
};
