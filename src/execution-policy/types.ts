import { PredicateComponent } from '../types/predicate.js';

/** An asynchronous method with a typed receiver, arguments, and result. */
export type AsyncMethod<
  T = unknown,
  A extends unknown[] = unknown[],
  R = unknown,
> = (this: T, ...args: A) => Promise<R>;

/**
 * A TypeScript method decorator that can be applied only to asynchronous
 * methods while preserving their receiver, arguments, and resolved result
 * types.
 */
export type AsyncMethodDecorator = <T, A extends unknown[], R>(
  target: object,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<AsyncMethod<T, A, R>>,
) => TypedPropertyDescriptor<AsyncMethod<T, A, R>> | void;

/** Information about a failed method execution supplied to retry callbacks. */
export type RetryExecutionContext = Readonly<{
  /** The value thrown or rejected by the failed execution. */
  error: unknown;
  /** The one-based number of the execution that just failed. */
  attempt: number;
  /** The total number of executions allowed by the policy. */
  maxAttempts: number;
}>;

/**
 * A fixed delay in milliseconds or a callback that computes one from the
 * current retry context. The callback may be synchronous or asynchronous.
 */
export type RetryDelay =
  | number
  | ((context: RetryExecutionContext) => number | PromiseLike<number>);

/** A predicate component that determines whether an execution should retry. */
export type RetryPredicate = PredicateComponent<RetryExecutionContext>;

/** Options for {@link ExecutionPolicy.retryable}. */
export type RetryableExecutionPolicyOptions = {
  /**
   * The maximum number of executions, including the initial execution.
   * Must be a positive safe integer.
   */
  maxAttempts: number;
  /** The delay before an eligible retry. Defaults to zero milliseconds. */
  delay?: RetryDelay;
  /** Determines which failures are retryable. All failures retry by default. */
  retryIf?: RetryPredicate;
};

/**
 * Options for {@link ExecutionPolicy.shared}.
 *
 * This type is intentionally empty in the initial implementation. It is
 * reserved for future keyed coalescing options.
 */
export type SharedExecutionPolicyOptions = Record<string, never>;
