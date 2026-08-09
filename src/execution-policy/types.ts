import { PredicateComponent } from '../types/predicate.js';
import { ProviderComponent } from '../types/provider.js';

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
  delay?: number;
  /**
   * Provides the delay before an eligible retry from its failure context.
   * Takes precedence over `delay` when both are supplied.
   */
  delayProvider?: ProviderComponent<number, RetryExecutionContext>;
  /** Determines which failures are retryable. All failures retry by default. */
  retryPredicate?: RetryPredicate;
};

/**
 * Information about a method invocation supplied to a shared execution
 * policy's key provider.
 */
export type SharedExecutionContext = Readonly<{
  /** The arguments supplied to the invocation. */
  args: unknown[];
}>;

/**
 * A provider component that computes the key used to share an execution
 * with concurrent callers.
 *
 * May be synchronous or asynchronous. Two invocations that compute the
 * same key (compared as a `Map` key) on the same receiver share one
 * execution; all others execute independently. A synchronous key preserves
 * the exact same Promise reference for every caller sharing an execution;
 * an asynchronous key still guarantees a single execution and an
 * equal-valued result for every caller, but each caller receives its own
 * Promise wrapper rather than a literal shared reference, since the key
 * must be awaited before the policy can decide whether to join an
 * existing execution.
 */
export type SharedExecutionKeyProvider = ProviderComponent<
  unknown,
  SharedExecutionContext
>;

/** Options shared by {@link ExecutionPolicy.shared} and {@link ExecutionPolicy.single}. */
export type SharedExecutionPolicyOptions = {
  /**
   * Computes the key used to share an invocation with concurrent callers
   * on the same receiver. Defaults to a single fixed key, so all
   * concurrent calls on a receiver share regardless of arguments.
   */
  keyProvider?: SharedExecutionKeyProvider;
};
