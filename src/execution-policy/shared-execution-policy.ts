import { AsyncMethod, SharedExecutionPolicyOptions } from './types.js';
import { decorateAsyncMethod, invokeAsyncMethod } from './async-method.js';
import { isObject } from '../is-object.js';

/** Decorates asynchronous methods to share in-flight executions. */
export class SharedExecutionPolicy {
  /**
   * Creates a shared execution policy.
   *
   * @param opts - Reserved options for future keyed coalescing support.
   * @throws {TypeError} If the reserved options object contains any fields.
   */
  constructor(opts: SharedExecutionPolicyOptions = {}) {
    if (Object.keys(opts).length > 0) {
      throw new TypeError('Shared execution policy options are reserved');
    }
  }

  /**
   * Decorates an asynchronous method to share one execution per receiver.
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
    return decorateAsyncMethod(method => {
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
        if (current) return current;

        const promise = invokeAsyncMethod(method, this, args);
        executing.set(this, promise);
        const clear = () => {
          if (executing.get(this) === promise) executing.delete(this);
        };
        // The cleanup handlers consume both outcomes of the derived promise.
        // eslint-disable-next-line promise/prefer-await-to-then
        promise.then(clear, clear).catch(clear);
        return promise;
      };
    })(target, propertyKey, descriptor);
  }
}
