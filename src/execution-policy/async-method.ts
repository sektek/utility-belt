import { AsyncMethod, AsyncMethodDecorator } from './types.js';
import { isPromiseLike } from '../is-promise-like.js';

/** Type-erased asynchronous method used by policy implementations. */
export type AnyAsyncMethod = AsyncMethod<unknown, unknown[], unknown>;

/**
 * Invokes an asynchronous method while normalizing synchronous failures.
 *
 * @param method - The asynchronous method to invoke.
 * @param receiver - The method receiver.
 * @param args - The arguments supplied to the method.
 * @returns A promise for the method result.
 */
export const invokeAsyncMethod = (
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

/**
 * Creates a typed decorator from a type-erased asynchronous method wrapper.
 *
 * @param wrap - Wraps the decorated asynchronous method.
 * @returns A typed asynchronous method decorator.
 */
export const decorateAsyncMethod =
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
