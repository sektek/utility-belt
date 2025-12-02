import { ExecutableFn, ExecutionStrategy } from '../types/index.js';
import { ExecutionError } from './execution-error.js';

export type ParallelExecutionStrategyOptions = {
  /** The maximum number of concurrent executions. */
  maxConcurrency?: number;
};

export class ParallelExecutionStrategy<T extends ExecutableFn = ExecutableFn>
  implements ExecutionStrategy<T>
{
  #maxConcurrency: number;

  constructor(opts: ParallelExecutionStrategyOptions = {}) {
    this.#maxConcurrency = opts.maxConcurrency ?? 10;
  }

  async execute(
    fns: Iterable<T> | AsyncIterable<T>,
    ...args: Parameters<T>
  ): Promise<void> {
    let concurrency = 0;
    const executing: Promise<unknown>[] = [];
    const results: PromiseSettledResult<unknown>[] = [];

    for await (const fn of fns) {
      if (concurrency >= this.#maxConcurrency) {
        await Promise.race(executing);
      }

      const p = (async () => {
        try {
          const result = await fn(...args);
          results.push({ status: 'fulfilled', value: result });
        } catch (error) {
          results.push({ status: 'rejected', reason: error });
        } finally {
          concurrency--;
        }
      })();
      executing.push(p);
      concurrency++;
    }

    results.push(...(await Promise.allSettled(executing)));

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
