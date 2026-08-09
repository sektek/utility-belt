import {
  AsyncMethodDecorator,
  RetryableExecutionPolicyOptions,
  SharedExecutionPolicyOptions,
} from './types.js';
import { RetryableExecutionPolicy } from './retryable-execution-policy.js';
import { SharedExecutionPolicy } from './shared-execution-policy.js';
import { SingleExecutionPolicy } from './single-execution-policy.js';

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
   * `retryPredicate` returns `false`.
   *
   * @param opts - Retry count, delay, and failure-filtering options.
   * @returns A decorator for an asynchronous method.
   * @throws {RangeError} If `maxAttempts` or a fixed delay is invalid.
   */
  static retryable(
    opts: RetryableExecutionPolicyOptions,
  ): AsyncMethodDecorator {
    const policy = new RetryableExecutionPolicy(opts);
    return policy.wrap.bind(policy);
  }

  /**
   * Creates a decorator that shares one execution per receiver and key with
   * concurrent callers.
   *
   * Concurrent calls on the same receiver and key — a single fixed key by
   * default, so all concurrent calls share regardless of arguments — reuse
   * the same execution and its outcome. That execution is cleared once it
   * settles, whether it fulfills or rejects, so the next call starts a new
   * execution. For an execution that keeps being shared with future callers
   * after it succeeds, see {@link ExecutionPolicy.single}.
   *
   * @param opts - Coalescing-key options.
   * @returns A decorator for an asynchronous method.
   */
  static shared(opts: SharedExecutionPolicyOptions = {}): AsyncMethodDecorator {
    const policy = new SharedExecutionPolicy(opts);
    return policy.wrap.bind(policy);
  }

  /**
   * Creates a decorator that executes a method at most once per receiver
   * and key and shares the outcome with every caller.
   *
   * Concurrent calls on the same receiver and key share the same execution,
   * as with {@link ExecutionPolicy.shared}. Once that execution succeeds, it
   * stays recorded and every later call — concurrent or not — receives the
   * same resolved value without invoking the method again. A rejected
   * execution is cleared instead, so the next call retries.
   *
   * @param opts - Coalescing-key options.
   * @returns A decorator for an asynchronous method.
   */
  static single(opts: SharedExecutionPolicyOptions = {}): AsyncMethodDecorator {
    const policy = new SingleExecutionPolicy(opts);
    return policy.wrap.bind(policy);
  }
}
