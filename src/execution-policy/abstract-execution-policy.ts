import { AnyAsyncMethod } from './async-method.js';
import { AsyncMethod } from './types.js';

/**
 * Base class for execution policies that wrap asynchronous functions.
 *
 * Handles type preservation while concrete policies implement
 * `createExecutor`, the function that replaces the wrapped function.
 */
export abstract class AbstractExecutionPolicy {
  /**
   * Wraps an asynchronous function with this policy's execution behavior.
   *
   * @template T - The method receiver type.
   * @template A - The method argument tuple.
   * @template R - The resolved method result type.
   * @param method - The asynchronous function to wrap.
   * @returns A function with the same receiver, arguments, and result type.
   */
  wrap<T, A extends unknown[], R>(
    method: AsyncMethod<T, A, R>,
  ): AsyncMethod<T, A, R> {
    return this.createExecutor(method as AnyAsyncMethod) as AsyncMethod<
      T,
      A,
      R
    >;
  }

  /**
   * Creates the function that replaces a wrapped function's implementation.
   *
   * @param method - The original wrapped function, type-erased.
   * @returns The function that replaces it.
   */
  protected abstract createExecutor(method: AnyAsyncMethod): AnyAsyncMethod;
}
