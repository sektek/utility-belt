import {
  AsyncMethod,
  SharedExecutionContext,
  SharedExecutionPolicyOptions,
} from './types.js';
import { ProviderFn } from '../types/provider.js';
import { decorateAsyncMethod } from './async-method.js';
import { decorateSharedMethod } from './shared-method.js';
import { getComponent } from '../get-component.js';
import { singleKeyProvider } from './key-providers.js';

/**
 * Decorates asynchronous methods to share in-flight executions.
 *
 * Concurrent calls on the same receiver and key reuse the same execution.
 * The recorded execution is always cleared once it settles, whether it
 * fulfills or rejects, so the next call — even immediately after — starts a
 * new execution. For an execution that stays shared with future callers
 * after it succeeds, see {@link MemoizeExecutionPolicy}.
 *
 * Defaults to `singleKeyProvider`, so all concurrent calls on a receiver
 * share regardless of arguments.
 */
export class SharedExecutionPolicy {
  #keyProvider: ProviderFn<unknown, SharedExecutionContext>;

  /**
   * Creates a shared execution policy.
   *
   * @param opts - Coalescing-key options.
   */
  constructor(opts: SharedExecutionPolicyOptions = {}) {
    this.#keyProvider = getComponent(opts.keyProvider, 'get', {
      name: 'keyProvider',
      default: singleKeyProvider,
    });
  }

  /**
   * Decorates an asynchronous method to share executions per receiver and
   * key.
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
      decorateSharedMethod(this.#keyProvider.bind(this), () => false),
    )(target, propertyKey, descriptor);
  }
}
