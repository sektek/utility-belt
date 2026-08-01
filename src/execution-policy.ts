import { sleep } from './sleep.js';

type AsyncMethod<
  TThis = unknown,
  TArgs extends unknown[] = unknown[],
  TResult = unknown,
> = (this: TThis, ...args: TArgs) => Promise<TResult>;

export type AsyncMethodDecorator = <TThis, TArgs extends unknown[], TResult>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<AsyncMethod<TThis, TArgs, TResult>>,
) => TypedPropertyDescriptor<AsyncMethod<TThis, TArgs, TResult>> | void;

export type RetryExecutionContext = Readonly<{
  error: unknown;
  attempt: number;
  maxAttempts: number;
}>;

export type RetryDelay =
  | number
  | ((context: RetryExecutionContext) => number | PromiseLike<number>);

export type RetryPredicate = (
  context: RetryExecutionContext,
) => boolean | PromiseLike<boolean>;

export type RetryableExecutionPolicyOptions = {
  maxAttempts: number;
  delay?: RetryDelay;
  retryIf?: RetryPredicate;
};

/** Reserved for future keyed coalescing options. */
export type SharedExecutionPolicyOptions = Record<string, never>;

type AnyAsyncMethod = AsyncMethod<unknown, unknown[], unknown>;

const isObject = (value: unknown): value is object =>
  (typeof value === 'object' && value !== null) || typeof value === 'function';

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  isObject(value) && typeof (value as { then?: unknown }).then === 'function';

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
  opts: RetryableExecutionPolicyOptions,
  context: RetryExecutionContext,
): Promise<boolean> => !opts.retryIf || (await opts.retryIf(context));

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
      if (!(await shouldRetry(opts, context))) {
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

/** Policies for controlling asynchronous method execution. */
export class ExecutionPolicy {
  private constructor() {}

  static retryable(
    opts: RetryableExecutionPolicyOptions,
  ): AsyncMethodDecorator {
    if (!Number.isSafeInteger(opts.maxAttempts) || opts.maxAttempts < 1) {
      throw new RangeError('maxAttempts must be a positive safe integer');
    }
    if (typeof opts.delay === 'number') {
      validateDelay(opts.delay);
    }

    return decorate(
      method =>
        function (this: unknown, ...args: unknown[]) {
          return executeWithRetry(method, this, args, opts);
        },
    );
  }

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
