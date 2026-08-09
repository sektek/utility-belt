import { AnyAsyncMethod } from './async-method.js';
import { AsyncMethod } from './types.js';

/**
 * Base class for `ExecutionPolicy` decorators.
 *
 * Handles the mechanics common to every policy — validating that the
 * decorated member is a method and replacing its implementation — so a
 * concrete policy only needs to implement `createExecutor`, the function
 * that becomes the method's new implementation.
 */
export abstract class AbstractExecutionPolicy {
  /**
   * Decorates an asynchronous method, replacing its implementation with
   * the executor this policy creates for it via `createExecutor`.
   *
   * @template T - The method receiver type.
   * @template A - The method argument tuple.
   * @template R - The resolved method result type.
   * @param _target - The decorated method's target.
   * @param propertyKey - The decorated method's property key.
   * @param descriptor - The decorated method's property descriptor.
   * @returns The updated property descriptor.
   * @throws {TypeError} If the decorated class member has no method value.
   */
  wrap<T, A extends unknown[], R>(
    _target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<AsyncMethod<T, A, R>>,
  ): TypedPropertyDescriptor<AsyncMethod<T, A, R>> | void {
    if (!descriptor.value) {
      throw new TypeError(
        `ExecutionPolicy can only decorate methods (${String(propertyKey)})`,
      );
    }
    descriptor.value = this.createExecutor(
      descriptor.value as AnyAsyncMethod,
    ) as typeof descriptor.value;
    return descriptor;
  }

  /**
   * Creates the function that replaces a decorated method's implementation.
   *
   * @param method - The original decorated method, type-erased.
   * @returns The function that replaces it.
   */
  protected abstract createExecutor(method: AnyAsyncMethod): AnyAsyncMethod;
}
