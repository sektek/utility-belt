import { ExecutableFn, ExecutionStrategy } from '../types/index.js';
import { ExecutionError } from './execution-error.js';
import { ExecutionSet } from './execution-set.js';

const DEFAULT_MAX_CONCURRENCY = Infinity;

export type ParallelExecutionStrategyOptions = {
  /**
   * The maximum number of concurrent executions. If provided, this must be a
   * non-negative number. If not specified or set to 0 it will default to no
   * limit.
   */
  maxConcurrency?: number;
};

class Executor {
  #maxConcurrency: number;
  #executing: ExecutionSet;
  #results: PromiseSettledResult<unknown>[];

  constructor(maxConcurrency: number) {
    this.#maxConcurrency = maxConcurrency;
    this.#executing = new ExecutionSet();
    this.#results = [];
  }

  async execute<T extends ExecutableFn>(fn: T, ...args: Parameters<T>) {
    const exec = async () => {
      try {
        const result = await fn(...args);
        this.#results.push({ status: 'fulfilled', value: result });
      } catch (error) {
        this.#results.push({ status: 'rejected', reason: error });
      }
    };
    // eslint-disable-next-line promise/prefer-await-to-then
    const p = exec().finally(() => {
      this.#executing.delete(p);
    });
    this.#executing.add(p);

    if (this.#executing.size >= this.#maxConcurrency) {
      await Promise.race(this.#executing);
    }
  }

  async results(): Promise<PromiseSettledResult<unknown>[]> {
    await Promise.all(this.#executing);
    return this.#results;
  }
}

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
    if (opts.maxConcurrency !== undefined && opts.maxConcurrency < 0) {
      throw new Error('maxConcurrency must be a positive number.');
    }
    this.#maxConcurrency = opts.maxConcurrency ?? DEFAULT_MAX_CONCURRENCY;
    if (this.#maxConcurrency <= 0) {
      this.#maxConcurrency = DEFAULT_MAX_CONCURRENCY;
    }
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
    const executor = new Executor(this.#maxConcurrency);

    if (Symbol.asyncIterator in Object(fns)) {
      for await (const fn of fns) {
        await executor.execute(fn, ...args);
      }
    } else {
      for (const fn of fns as Iterable<T>) {
        await executor.execute(fn, ...args);
      }
    }

    const results = await executor.results();
    const rejected = results.filter(result => result.status === 'rejected');

    if (rejected.length) {
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
