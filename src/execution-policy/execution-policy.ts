import {
  AsyncMethodDecorator,
  KeyedExecutionPolicyOptions,
  RetryableExecutionPolicyOptions,
} from './types.js';
import { AbstractExecutionPolicy } from './abstract-execution-policy.js';
import { MemoizeExecutionPolicy } from './memoize-execution-policy.js';
import { RetryableExecutionPolicy } from './retryable-execution-policy.js';
import { SharedExecutionPolicy } from './shared-execution-policy.js';

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
    return ExecutionPolicy.decorate(policy);
  }

  /**
   * Creates a decorator that shares one execution per receiver and key with
   * concurrent callers.
   *
   * Concurrent calls on the same receiver and key reuse the same execution
   * and its outcome. That execution is cleared once it settles, whether it
   * fulfills or rejects, so the next call starts a new execution. For an
   * execution that keeps being shared with future callers after it
   * succeeds, see {@link ExecutionPolicy.memoize}.
   *
   * Defaults to `singleKeyProvider`, so all concurrent calls share
   * regardless of arguments.
   *
   * @template KeyArgs - The decorated method's argument tuple, used to type
   *   `opts.keyProvider`'s `args`. Defaults to `unknown[]`; supply it
   *   explicitly (e.g. `ExecutionPolicy.shared<[Event]>(...)`) to type a
   *   custom `keyProvider` against the method's real parameters instead of
   *   casting inside it.
   * @param opts - Coalescing-key options.
   * @returns A decorator for an asynchronous method.
   */
  static shared<KeyArgs extends unknown[] = unknown[]>(
    opts: KeyedExecutionPolicyOptions<KeyArgs> = {},
  ): AsyncMethodDecorator {
    const policy = new SharedExecutionPolicy(opts);
    return ExecutionPolicy.decorate(policy);
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
   * Defaults to `firstArgumentKeyProvider`, so calls are memoized per first
   * argument — a method with no arguments therefore behaves like a
   * singleton. Pass `keyProvider: singleKeyProvider` to memoize the whole
   * method regardless of arguments instead.
   *
   * @template KeyArgs - The decorated method's argument tuple, used to type
   *   `opts.keyProvider`'s `args`. Defaults to `unknown[]`; supply it
   *   explicitly (e.g. `ExecutionPolicy.memoize<[Event]>(...)`) to type a
   *   custom `keyProvider` against the method's real parameters instead of
   *   casting inside it.
   * @param opts - Coalescing-key options.
   * @returns A decorator for an asynchronous method.
   */
  static memoize<KeyArgs extends unknown[] = unknown[]>(
    opts: KeyedExecutionPolicyOptions<KeyArgs> = {},
  ): AsyncMethodDecorator {
    const policy = new MemoizeExecutionPolicy(opts);
    return ExecutionPolicy.decorate(policy);
  }

  /**
   * Adapts an execution policy into a TypeScript method decorator.
   *
   * @param policy - The execution policy used to wrap the decorated method.
   * @returns A decorator for an asynchronous method.
   */
  static decorate(policy: AbstractExecutionPolicy): AsyncMethodDecorator {
    return (_target, propertyKey, descriptor) => {
      if (!descriptor.value) {
        throw new TypeError(
          `ExecutionPolicy can only decorate methods (${String(propertyKey)})`,
        );
      }
      descriptor.value = policy.wrap(
        descriptor.value,
      ) as typeof descriptor.value;
      return descriptor;
    };
  }
}
