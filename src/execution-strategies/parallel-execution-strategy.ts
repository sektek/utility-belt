import { ExecutableFn } from '../types/index.js';
import { ExecutionError } from './execution-error.js';

export const parallelExecutionStrategy = async <
  T extends ExecutableFn = ExecutableFn,
>(
  fns: T | T[],
  ...args: Parameters<T>
): Promise<ReturnType<T>[]> => {
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

  return results
    .filter(result => result.status === 'fulfilled')
    .map(result => result.value as ReturnType<T>);
};

// export type ParallelExecutionStrategyOptions<T extends ExecutableFn> = {
//   concurrency?: number;
// };

// export class ParallelExecutionStrategy<T extends ExecutableFn = ExecutableFn> {
//   #concurrency: number;

//   constructor(opts: ParallelExecutionStrategyOptions<T> = {}) {
//     this.#concurrency = opts.concurrency || 0;
//   }

//   execute(fns: T | T[], ...args: Parameters<T>): PromiseLike<ReturnType<T>[]> {
//     if (this.#concurrency > 0 && [fns].flat().length > this.#concurrency) {
//       return this.#executeWithConcurrency(fns, ...args);
//     }
//     return parallelExecutionStrategy<T>(fns, ...args);
//   }

//   async #executeWithConcurrency(
//     fns: T | T[],
//     ...args: Parameters<T>
//   ): Promise<ReturnType<T>[]> {
//     const executables = [fns].flat();
//     const results: ReturnType<T>[] = [];
//     const promises: Promise<T>[] = [];

//     for (const fn of executables) {

// }
