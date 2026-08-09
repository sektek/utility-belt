import { AnyAsyncMethod, invokeAsyncMethod } from './async-method.js';
import { ProviderFn } from '../types/provider.js';
import { SharedExecutionContext } from './types.js';
import { isObject } from '../is-object.js';
import { isPromiseLike } from '../is-promise-like.js';

/** The outcome of a settled execution, supplied to a retention rule. */
export type SettlementOutcome = 'fulfilled' | 'rejected';

/**
 * Wraps an asynchronous method so concurrent calls on the same receiver and
 * key share one execution.
 *
 * The key is computed once per invocation via `keyProvider`, which may be
 * synchronous or asynchronous. If an execution is already recorded for the
 * receiver and key, its promise is returned directly. Otherwise the method
 * is invoked and its promise is recorded. Once the execution settles,
 * `retain` decides whether it stays recorded for future calls to reuse or
 * is cleared so the next call executes again. This is the shared mechanism
 * behind both `SharedExecutionPolicy` (always clears) and
 * `SingleExecutionPolicy` (clears only on rejection).
 *
 * When `keyProvider` resolves synchronously, concurrent callers that share
 * an execution receive the exact same Promise instance. When it resolves
 * asynchronously, every caller still receives a Promise that settles with
 * the same outcome and only one execution ever occurs, but each caller
 * gets its own Promise wrapper rather than a shared reference — the key
 * must be awaited before the policy can decide whether to join an
 * existing execution.
 *
 * @param keyProvider - Computes the sharing key from an invocation's
 *   arguments.
 * @param retain - Determines whether a settled execution's entry is kept.
 * @returns A function that wraps an async method with shared execution.
 */
export const decorateSharedMethod =
  (
    keyProvider: ProviderFn<unknown, SharedExecutionContext>,
    retain: (outcome: SettlementOutcome) => boolean,
  ) =>
  (method: AnyAsyncMethod): AnyAsyncMethod => {
    const executionsByReceiver = new WeakMap<
      object,
      Map<unknown, Promise<unknown>>
    >();

    const join = (
      receiver: object,
      key: unknown,
      args: unknown[],
    ): Promise<unknown> => {
      let executions = executionsByReceiver.get(receiver);
      if (!executions) {
        executions = new Map();
        executionsByReceiver.set(receiver, executions);
      }

      const current = executions.get(key);
      if (current) return current;

      const promise = invokeAsyncMethod(method, receiver, args);
      executions.set(key, promise);
      const settle = (outcome: SettlementOutcome) => {
        if (!retain(outcome) && executions.get(key) === promise) {
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
    };

    return function (this: unknown, ...args: unknown[]): Promise<unknown> {
      if (!isObject(this)) {
        return Promise.reject(
          new TypeError('A shared ExecutionPolicy requires an object receiver'),
        );
      }

      const keyResult = keyProvider({ args });
      if (!isPromiseLike(keyResult)) {
        return join(this, keyResult, args);
      }

      // eslint-disable-next-line promise/prefer-await-to-then
      return Promise.resolve(keyResult).then(key => join(this, key, args));
    };
  };
