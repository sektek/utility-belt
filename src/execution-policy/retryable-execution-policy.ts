import {
  AnyAsyncMethod,
  decorateAsyncMethod,
  invokeAsyncMethod,
} from './async-method.js';
import {
  AsyncMethodDecorator,
  RetryExecutionContext,
  RetryPredicate,
  RetryableExecutionPolicyOptions,
} from './types.js';
import { PredicateFn } from '../types/predicate.js';
import { getComponent } from '../get-component.js';
import { sleep } from '../sleep.js';

const validateDelay = (delay: number): number => {
  if (!Number.isFinite(delay) || delay < 0) {
    throw new RangeError('Retry delay must be a finite, non-negative number');
  }
  return delay;
};

const getRetryDelay = async (
  opts: RetryableExecutionPolicyOptions,
  context: RetryExecutionContext,
): Promise<number> =>
  validateDelay(
    typeof opts.delay === 'function'
      ? await opts.delay(context)
      : (opts.delay ?? 0),
  );

const executeWithRetry = async (
  method: AnyAsyncMethod,
  receiver: unknown,
  args: unknown[],
  opts: RetryableExecutionPolicyOptions,
  retryIf: PredicateFn<RetryExecutionContext> | undefined,
): Promise<unknown> => {
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt += 1) {
    try {
      return await invokeAsyncMethod(method, receiver, args);
    } catch (error) {
      if (attempt === opts.maxAttempts) throw error;

      const context: RetryExecutionContext = {
        error,
        attempt,
        maxAttempts: opts.maxAttempts,
      };
      if (retryIf && !(await retryIf(context))) throw error;

      const delay = await getRetryDelay(opts, context);
      if (delay > 0) await sleep(delay);
    }
  }
  throw new Error('ExecutionPolicy retry loop exhausted unexpectedly');
};

/**
 * Creates a decorator that retries rejected asynchronous method executions.
 *
 * @param opts - Retry count, delay, and failure-filtering options.
 * @returns A decorator for an asynchronous method.
 */
export const createRetryableExecutionPolicy = (
  opts: RetryableExecutionPolicyOptions,
): AsyncMethodDecorator => {
  if (!Number.isSafeInteger(opts.maxAttempts) || opts.maxAttempts < 1) {
    throw new RangeError('maxAttempts must be a positive safe integer');
  }
  if (typeof opts.delay === 'number') validateDelay(opts.delay);

  const retryIf = opts.retryIf
    ? getComponent<RetryPredicate, PredicateFn<RetryExecutionContext>>(
        opts.retryIf,
        'test',
      )
    : undefined;

  return decorateAsyncMethod(
    method =>
      function (this: unknown, ...args: unknown[]) {
        return executeWithRetry(method, this, args, opts, retryIf);
      },
  );
};
