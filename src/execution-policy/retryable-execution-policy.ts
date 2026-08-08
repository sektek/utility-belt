import {
  AnyAsyncMethod,
  decorateAsyncMethod,
  invokeAsyncMethod,
} from './async-method.js';
import {
  AsyncMethod,
  RetryExecutionContext,
  RetryPredicate,
  RetryableExecutionPolicyOptions,
} from './types.js';
import { PredicateFn } from '../types/predicate.js';
import { ProviderFn } from '../types/provider.js';
import { getComponent } from '../get-component.js';
import { sleep } from '../sleep.js';

/** Decorates asynchronous methods with configurable retry behavior. */
export class RetryableExecutionPolicy {
  #delayProvider: ProviderFn<number, RetryExecutionContext>;
  #opts: RetryableExecutionPolicyOptions;
  #retryPredicate: PredicateFn<RetryExecutionContext> | undefined;

  /**
   * Creates a retryable execution policy.
   *
   * @param opts - Retry count, delay, and failure-filtering options.
   * @throws {RangeError} If `maxAttempts` or a fixed delay is invalid.
   */
  constructor(opts: RetryableExecutionPolicyOptions) {
    if (!Number.isSafeInteger(opts.maxAttempts) || opts.maxAttempts < 1) {
      throw new RangeError('maxAttempts must be a positive safe integer');
    }
    if (!opts.delayProvider && opts.delay !== undefined) {
      RetryableExecutionPolicy.#validateDelay(opts.delay);
    }

    this.#opts = opts;
    this.#delayProvider = getComponent(opts.delayProvider, 'get', {
      name: 'delayProvider',
      default: () => opts.delay ?? 0,
    });
    this.#retryPredicate = opts.retryPredicate
      ? getComponent<RetryPredicate, PredicateFn<RetryExecutionContext>>(
          opts.retryPredicate,
          'test',
        )
      : undefined;
  }

  /**
   * Decorates an asynchronous method with this policy's retry behavior.
   *
   * @template T - The method receiver type.
   * @template A - The method argument tuple.
   * @template R - The resolved method result type.
   * @param target - The decorated method's target.
   * @param propertyKey - The decorated method's property key.
   * @param descriptor - The decorated method's property descriptor.
   * @returns The updated property descriptor.
   */
  wrap<T, A extends unknown[], R>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<AsyncMethod<T, A, R>>,
  ): TypedPropertyDescriptor<AsyncMethod<T, A, R>> | void {
    const execute = this.#execute.bind(this);
    return decorateAsyncMethod(
      method =>
        function (this: unknown, ...args: unknown[]) {
          return execute(method, this, args);
        },
    )(target, propertyKey, descriptor);
  }

  async #execute(
    method: AnyAsyncMethod,
    receiver: unknown,
    args: unknown[],
  ): Promise<unknown> {
    for (let attempt = 1; attempt <= this.#opts.maxAttempts; attempt += 1) {
      try {
        return await invokeAsyncMethod(method, receiver, args);
      } catch (error) {
        if (attempt === this.#opts.maxAttempts) throw error;

        const context: RetryExecutionContext = {
          error,
          attempt,
          maxAttempts: this.#opts.maxAttempts,
        };
        if (this.#retryPredicate && !(await this.#retryPredicate(context)))
          throw error;

        const delay = await this.#getRetryDelay(context);
        if (delay > 0) await sleep(delay);
      }
    }
    throw new Error('ExecutionPolicy retry loop exhausted unexpectedly');
  }

  async #getRetryDelay(context: RetryExecutionContext): Promise<number> {
    return RetryableExecutionPolicy.#validateDelay(
      await this.#delayProvider(context),
    );
  }

  static #validateDelay(delay: number): number {
    if (!Number.isFinite(delay) || delay < 0) {
      throw new RangeError('Retry delay must be a finite, non-negative number');
    }
    return delay;
  }
}
