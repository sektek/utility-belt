import { AsyncMethod } from './types.js';
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
        new TypeError(
          'Execution policies can only wrap asynchronous functions',
        ),
      );
};
