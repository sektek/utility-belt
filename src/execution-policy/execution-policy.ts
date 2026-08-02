import {
  AsyncMethodDecorator,
  RetryableExecutionPolicyOptions,
  SharedExecutionPolicyOptions,
} from './types.js';
import { createRetryableExecutionPolicy } from './retryable-execution-policy.js';
import { createSharedExecutionPolicy } from './shared-execution-policy.js';

/**
 * Decorator factories for controlling asynchronous method execution.
 *
 * Multiple policies can decorate the same method. Standard TypeScript
 * decorator ordering applies: the decorator closest to the method wraps it
 * first, and each decorator above it wraps the result.
 */
export class ExecutionPolicy {
  private constructor() {}

  /**
   * Creates a decorator that retries rejected method executions.
   *
   * The original receiver and arguments are reused for every attempt. The
   * final failure is propagated unchanged when no attempts remain or when
   * `retryIf` returns `false`.
   *
   * @param opts - Retry count, delay, and failure-filtering options.
   * @returns A decorator for an asynchronous method.
   * @throws {RangeError} If `maxAttempts` or a fixed delay is invalid.
   */
  static retryable(
    opts: RetryableExecutionPolicyOptions,
  ): AsyncMethodDecorator {
    return createRetryableExecutionPolicy(opts);
  }

  /**
   * Creates a decorator that shares one in-flight method execution per object
   * instance.
   *
   * Concurrent callers receive the first caller's promise and outcome,
   * regardless of their arguments. The shared execution is cleared after it
   * fulfills or rejects, allowing the next call to start a new execution.
   *
   * @param opts - Reserved options for future keyed coalescing support.
   * @returns A decorator for an asynchronous method.
   * @throws {TypeError} If the reserved options object contains any fields.
   */
  static shared(opts: SharedExecutionPolicyOptions = {}): AsyncMethodDecorator {
    return createSharedExecutionPolicy(opts);
  }
}
