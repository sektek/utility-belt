import { PredicateComponent, PredicateFn } from './types/predicate.js';
import { getComponent } from './get-component.js';
import { isObject } from './is-object.js';
import { isPromiseLike } from './is-promise-like.js';
import { sleep } from './sleep.js';

type AsyncMethod<T = unknown, A extends unknown[] = unknown[], R = unknown> = (
  this: T,
  ...args: A
) => Promise<R>;

/**
 * A TypeScript method decorator that can be applied only to asynchronous
 * methods while preserving their receiver, arguments, and resolved result
 * types.
 */
export type AsyncMethodDecorator = <T, A extends unknown[], R>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<AsyncMethod<T, A, R>>,
) => TypedPropertyDescriptor<AsyncMethod<T, A, R>> | void;

/**
 * Information about a failed method execution supplied to retry callbacks.
 */
export type RetryExecutionContext = Readonly<{
  /** The value thrown or rejected by the failed execution. */
  error: unknown;
  /** The one-based number of the execution that just failed. */
  attempt: number;
  /** The total number of executions allowed by the policy. */
  maxAttempts: number;
}>;

/**
 * A fixed delay in milliseconds or a callback that computes one from the
 * current retry context. The callback may be synchronous or asynchronous.
 */
export type RetryDelay =
  | number
  | ((context: RetryExecutionContext) => number | PromiseLike<number>);

/**
 * A synchronous or asynchronous callback that determines whether a failed
 * execution should be retried.
 */
export type RetryPredicate = PredicateComponent<RetryExecutionContext>;

/** Options for {@link ExecutionPolicy.retryable}. */
export type RetryableExecutionPolicyOptions = {
  /**
   * The maximum number of executions, including the initial execution.
   * Must be a positive safe integer.
   */
  maxAttempts: number;
  /**
   * The delay before an eligible retry. Defaults to zero milliseconds.
   */
  delay?: RetryDelay;
  /**
   * Determines which failures are retryable. All failures retry by default.
   */
  retryIf?: RetryPredicate;
};

/**
 * Options for {@link ExecutionPolicy.shared}.
 *
 * This type is intentionally empty in the initial implementation. It is
 * reserved for future keyed coalescing options.
 */
export type SharedExecutionPolicyOptions = Record<string, never>;

type AnyAsyncMethod = AsyncMethod<unknown, unknown[], unknown>;

const invoke = (
  method: AnyAsyncMethod,
  receiver: unknown,
  args: unknown[],
): Promise<unknown> => {
  let result: unknown;
  try {
    result = method.apply(receiver, args);
  } catch (error) {
    return Promise.reject(error);
  }
  return isPromiseLike(result)
    ? Promise.resolve(result)
    : Promise.reject(
        new TypeError('ExecutionPolicy can only decorate asynchronous methods'),
      );
};

const validateDelay = (delay: number): number => {
  if (!Number.isFinite(delay) || delay < 0) {
    throw new RangeError('Retry delay must be a finite, non-negative number');
  }
  return delay;
};

const shouldRetry = async (
  retryIf: PredicateFn<RetryExecutionContext> | undefined,
  context: RetryExecutionContext,
): Promise<boolean> => !retryIf || (await retryIf(context));

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
      return await invoke(method, receiver, args);
    } catch (error) {
      if (attempt === opts.maxAttempts) {
        throw error;
      }
      const context: RetryExecutionContext = {
        error,
        attempt,
        maxAttempts: opts.maxAttempts,
      };
      if (!(await shouldRetry(retryIf, context))) {
        throw error;
      }
      const delay = await getRetryDelay(opts, context);
      if (delay > 0) {
        await sleep(delay);
      }
    }
  }
  throw new Error('ExecutionPolicy retry loop exhausted unexpectedly');
};

const decorate =
  (wrap: (method: AnyAsyncMethod) => AnyAsyncMethod): AsyncMethodDecorator =>
  (_target, propertyKey, descriptor) => {
    if (!descriptor.value) {
      throw new TypeError(
        `ExecutionPolicy can only decorate methods (${String(propertyKey)})`,
      );
    }
    descriptor.value = wrap(
      descriptor.value as AnyAsyncMethod,
    ) as typeof descriptor.value;
    return descriptor;
  };

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
    if (!Number.isSafeInteger(opts.maxAttempts) || opts.maxAttempts < 1) {
      throw new RangeError('maxAttempts must be a positive safe integer');
    }
    if (typeof opts.delay === 'number') {
      validateDelay(opts.delay);
    }
    const retryIf = opts.retryIf
      ? getComponent<RetryPredicate, PredicateFn<RetryExecutionContext>>(
          opts.retryIf,
          'test',
        )
      : undefined;

    return decorate(
      method =>
        function (this: unknown, ...args: unknown[]) {
          return executeWithRetry(method, this, args, opts, retryIf);
        },
    );
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
    if (Object.keys(opts).length > 0) {
      throw new TypeError('Shared execution policy options are reserved');
    }
    return decorate(method => {
      const executing = new WeakMap<object, Promise<unknown>>();
      return function (this: unknown, ...args: unknown[]): Promise<unknown> {
        if (!isObject(this)) {
          return Promise.reject(
            new TypeError(
              'A shared ExecutionPolicy requires an object receiver',
            ),
          );
        }
        const current = executing.get(this);
        if (current) {
          return current;
        }
        const promise = invoke(method, this, args);
        executing.set(this, promise);
        const clear = () => {
          if (executing.get(this) === promise) {
            executing.delete(this);
          }
        };
        // The cleanup handlers consume both outcomes of the derived promise.
        // eslint-disable-next-line promise/prefer-await-to-then
        promise.then(clear, clear).catch(clear);
        return promise;
      };
    });
  }
}
