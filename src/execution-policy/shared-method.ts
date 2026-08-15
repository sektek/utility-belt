import { AnyAsyncMethod, invokeAsyncMethod } from './async-method.js';
import { SettlementOutcome, SharedExecutionKeyProviderFn } from './types.js';
import { isObject } from '../is-object.js';
import { isPromiseLike } from '../is-promise-like.js';

/**
 * Executes a wrapped function so concurrent calls on the same receiver and
 * key share one execution.
 *
 * One instance is created per wrapped function (by
 * {@link AbstractSharedExecutionPolicy}), so its recorded executions
 * never leak between two different functions that
 * happen to share a policy instance. The key is computed once per
 * invocation via `keyProvider`, which may be synchronous or asynchronous.
 * If an execution is already recorded for the receiver and key, its
 * promise is returned directly. Otherwise the method is invoked and its
 * promise is recorded. Once the execution settles, `retain` decides
 * whether it stays recorded for future calls to reuse or is cleared so the
 * next call executes again. This is the shared mechanism behind both
 * `SharedExecutionPolicy` (always clears) and `MemoizeExecutionPolicy`
 * (clears only on rejection).
 *
 * When `keyProvider` resolves synchronously, concurrent callers that share
 * an execution receive the exact same Promise instance. When it resolves
 * asynchronously, every caller still receives a Promise that settles with
 * the same outcome and only one execution ever occurs, but each caller
 * gets its own Promise wrapper rather than a shared reference — the key
 * must be awaited before the policy can decide whether to join an
 * existing execution.
 */
export class SharedMethodExecution {
  #executionsByPrimitiveReceiver = new Map<
    unknown,
    Map<unknown, Promise<unknown>>
  >();
  #method: AnyAsyncMethod;
  #keyProvider: SharedExecutionKeyProviderFn;
  #retain: (outcome: SettlementOutcome) => boolean;
  #executionsByReceiver = new WeakMap<object, Map<unknown, Promise<unknown>>>();

  /**
   * Creates a shared method execution.
   *
   * @param method - The wrapped function being executed.
   * @param keyProvider - Computes the sharing key from an invocation's
   *   arguments.
   * @param retain - Determines whether a settled execution's entry is kept.
   */
  constructor(
    method: AnyAsyncMethod,
    keyProvider: SharedExecutionKeyProviderFn,
    retain: (outcome: SettlementOutcome) => boolean,
  ) {
    this.#method = method;
    this.#keyProvider = keyProvider;
    this.#retain = retain;
  }

  /**
   * Invokes the wrapped function for a receiver and arguments, joining an
   * existing execution when one is already recorded for the same key.
   *
   * @param receiver - The wrapped function's receiver.
   * @param args - The arguments supplied to the invocation.
   * @returns A promise for the (possibly shared) execution's result.
   */
  invoke(receiver: unknown, args: unknown[]): Promise<unknown> {
    let keyResult: unknown | PromiseLike<unknown>;
    try {
      keyResult = this.#keyProvider(...args);
    } catch (error) {
      return Promise.reject(error);
    }

    if (!isPromiseLike(keyResult)) {
      return this.#join(receiver, keyResult, args);
    }

    // eslint-disable-next-line promise/prefer-await-to-then
    return Promise.resolve(keyResult).then(key =>
      this.#join(receiver, key, args),
    );
  }

  #join(receiver: unknown, key: unknown, args: unknown[]): Promise<unknown> {
    let executions = this.#getExecutions(receiver);
    if (!executions) {
      executions = new Map();
      if (isObject(receiver)) {
        this.#executionsByReceiver.set(receiver, executions);
      } else {
        this.#executionsByPrimitiveReceiver.set(receiver, executions);
      }
    }

    const current = executions.get(key);
    if (current) return current;

    const promise = invokeAsyncMethod(this.#method, receiver, args);
    executions.set(key, promise);
    const settle = (outcome: SettlementOutcome) => {
      if (!this.#retain(outcome) && executions.get(key) === promise) {
        executions.delete(key);
        if (
          executions.size === 0 &&
          !isObject(receiver) &&
          this.#executionsByPrimitiveReceiver.get(receiver) === executions
        ) {
          this.#executionsByPrimitiveReceiver.delete(receiver);
        }
      }
    };
    // The settlement handlers consume both outcomes of the derived promise.
    /* eslint-disable promise/prefer-await-to-then */
    promise
      .then(
        () => settle('fulfilled'),
        () => settle('rejected'),
      )
      .catch(() => settle('rejected'));
    /* eslint-enable promise/prefer-await-to-then */
    return promise;
  }

  #getExecutions(
    receiver: unknown,
  ): Map<unknown, Promise<unknown>> | undefined {
    return isObject(receiver)
      ? this.#executionsByReceiver.get(receiver)
      : this.#executionsByPrimitiveReceiver.get(receiver);
  }
}
