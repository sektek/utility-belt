import { AsyncMethodDecorator, SharedExecutionPolicyOptions } from './types.js';
import { decorateAsyncMethod, invokeAsyncMethod } from './async-method.js';
import { isObject } from '../is-object.js';

/**
 * Creates a decorator that shares one in-flight execution per receiver.
 *
 * @param opts - Reserved options for future keyed coalescing support.
 * @returns A decorator for an asynchronous method.
 */
export const createSharedExecutionPolicy = (
  opts: SharedExecutionPolicyOptions = {},
): AsyncMethodDecorator => {
  if (Object.keys(opts).length > 0) {
    throw new TypeError('Shared execution policy options are reserved');
  }

  return decorateAsyncMethod(method => {
    const executing = new WeakMap<object, Promise<unknown>>();
    return function (this: unknown, ...args: unknown[]): Promise<unknown> {
      if (!isObject(this)) {
        return Promise.reject(
          new TypeError('A shared ExecutionPolicy requires an object receiver'),
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
  });
};
