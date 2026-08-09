import {
  AsyncMethod,
  SharedExecutionContext,
  SharedExecutionPolicyOptions,
} from './types.js';
import { ProviderFn } from '../types/provider.js';
import { decorateAsyncMethod } from './async-method.js';
import { decorateSharedMethod } from './shared-method.js';
import { firstArgumentKeyProvider } from './key-providers.js';
import { getComponent } from '../get-component.js';

/**
 * Decorates asynchronous methods so each receiver and key executes the
 * method at most once and shares the outcome with every caller.
 *
 * Concurrent calls on the same receiver and key reuse the same execution,
 * as with {@link SharedExecutionPolicy}. Once that execution succeeds, it
 * stays recorded and every later call — concurrent or not — receives the
 * same resolved value without invoking the method again. A rejected
 * execution is cleared instead, so the next call retries.
 *
 * Defaults to `firstArgumentKeyProvider`, so calls are memoized per first
 * argument. Pass `keyProvider: singleKeyProvider` for singleton behavior —
 * one retained execution per receiver regardless of arguments.
 */
export class MemoizeExecutionPolicy {
  #keyProvider: ProviderFn<unknown, SharedExecutionContext>;

  /**
   * Creates a memoize execution policy.
   *
   * @param opts - Coalescing-key options.
   */
  constructor(opts: SharedExecutionPolicyOptions = {}) {
    this.#keyProvider = getComponent(opts.keyProvider, 'get', {
      name: 'keyProvider',
      default: firstArgumentKeyProvider,
    });
  }

  /**
   * Decorates an asynchronous method so it executes at most once per
   * receiver and key.
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
    return decorateAsyncMethod(
      decorateSharedMethod(
        this.#keyProvider.bind(this),
        outcome => outcome === 'fulfilled',
      ),
    )(target, propertyKey, descriptor);
  }
}
