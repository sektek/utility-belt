import { AnyAsyncMethod, invokeAsyncMethod } from './async-method.js';
import { SettlementOutcome, SharedExecutionKeyProviderFn } from './types.js';
import { isObject } from '../is-object.js';
import { isPromiseLike } from '../is-promise-like.js';

/**
 * Executes a decorated method so concurrent calls on the same receiver and
 * key share one execution.
 *
 * One instance is created per decorated method (by
 * {@link AbstractSharedExecutionPolicy}), so its recorded executions
 * (`#executionsByReceiver`) never leak between two different methods that
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
  #method: AnyAsyncMethod;
  #keyProvider: SharedExecutionKeyProviderFn;
  #retain: (outcome: SettlementOutcome) => boolean;
  #executionsByReceiver = new WeakMap<object, Map<unknown, Promise<unknown>>>();

  /**
   * Creates a shared method execution.
   *
   * @param method - The decorated method being executed.
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
   * Invokes the decorated method for a receiver and arguments, joining an
   * existing execution when one is already recorded for the same key.
   *
   * @param receiver - The decorated method's receiver.
   * @param args - The arguments supplied to the invocation.
   * @returns A promise for the (possibly shared) execution's result.
   */
  invoke(receiver: unknown, args: unknown[]): Promise<unknown> {
    if (!isObject(receiver)) {
      return Promise.reject(
        new TypeError('A shared ExecutionPolicy requires an object receiver'),
      );
    }

    const keyResult = this.#keyProvider(...args);
    if (!isPromiseLike(keyResult)) {
      return this.#join(receiver, keyResult, args);
    }

    // eslint-disable-next-line promise/prefer-await-to-then
    return Promise.resolve(keyResult).then(key =>
      this.#join(receiver, key, args),
    );
  }

  #join(receiver: object, key: unknown, args: unknown[]): Promise<unknown> {
    let executions = this.#executionsByReceiver.get(receiver);
    if (!executions) {
      executions = new Map();
      this.#executionsByReceiver.set(receiver, executions);
    }

    const current = executions.get(key);
    if (current) return current;

    const promise = invokeAsyncMethod(this.#method, receiver, args);
    executions.set(key, promise);
    const settle = (outcome: SettlementOutcome) => {
      if (!this.#retain(outcome) && executions.get(key) === promise) {
        executions.delete(key);
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
}
