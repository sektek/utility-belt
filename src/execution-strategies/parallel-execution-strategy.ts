import { ExecutableFn, ExecutionStrategy } from '../types/index.js';
import { ExecutionError } from './execution-error.js';

const DEFAULT_MAX_CONCURRENCY = Infinity;

export type ParallelExecutionStrategyOptions = {
  /**
   * The maximum number of concurrent executions. If not specified,
   * defaults to no limit.
   */
  maxConcurrency?: number;
};

/**
 * An execution strategy that runs functions in parallel with optional
 * concurrency control. Executes all functions provided regardless of individual
 * failures, and aggregates errors if functions fail.
 *
 * @template T - The type of executable functions.
 */
export class ParallelExecutionStrategy<T extends ExecutableFn = ExecutableFn>
  implements ExecutionStrategy<T>
{
  #maxConcurrency: number;

  constructor(opts: ParallelExecutionStrategyOptions = {}) {
    this.#maxConcurrency = opts.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY;
  }

  /**
   * Executes the provided functions in parallel, respecting the maximum concurrency.
   * If one or more functions throw errors, an ExecutionError is thrown after all
   * functions have completed.
   *
   * @param fns - An iterable or async iterable of functions to execute.
   * @param args - The arguments to pass to each function.
   * @throws ExecutionError if one or more functions throw errors during execution.
   */
  async execute(
    fns: Iterable<T> | AsyncIterable<T>,
    ...args: Parameters<T>
  ): Promise<void> {
    let concurrency = 0;
    const executing: Set<Promise<unknown>> = new Set();
    const results: PromiseSettledResult<unknown>[] = [];

    for await (const fn of fns) {
      const exec = async () => {
        try {
          const result = await fn(...args);
          results.push({ status: 'fulfilled', value: result });
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
        } finally {
          concurrency--;
        }
      };
      // eslint-disable-next-line promise/prefer-await-to-then
      const p = exec().finally(() => {
        executing.delete(p);
      });
      executing.add(p);
      concurrency++;

      if (concurrency >= this.#maxConcurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);

    const rejected = results.filter(
      result => result.status === 'rejected',
    ) as PromiseRejectedResult[];

    if (rejected.length) {
      if (rejected.length === 1) {
        throw rejected[0].reason;
      }
      throw new ExecutionError(rejected.map(result => result.reason));
    }
  }
}

const DEFAULT_PARALLEL_EXECUTION_STRATEGY = new ParallelExecutionStrategy();

export const parallelExecutionStrategy = async <
  T extends ExecutableFn = ExecutableFn,
>(
  fns: Iterable<T> | AsyncIterable<T>,
  ...args: Parameters<T>
) => {
  return DEFAULT_PARALLEL_EXECUTION_STRATEGY.execute(fns, ...args);
};
