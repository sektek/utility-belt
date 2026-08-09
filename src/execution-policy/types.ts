import { Component } from '../types/component.js';
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
 * A function that computes the key used to share an execution with
 * concurrent callers, called with the decorated method's own arguments —
 * not a wrapping context object — so a key provider can be written exactly
 * like the extractor functions used elsewhere in this ecosystem (e.g. an
 * `EventExtractor`): name the parameters you need directly, with no
 * `unknown` to unwrap.
 *
 * May be synchronous or asynchronous; see {@link SharedExecutionKeyProvider}.
 *
 * @template A - The decorated method's argument tuple. Defaults to
 *   `unknown[]`; supply it explicitly (e.g.
 *   `ExecutionPolicy.memoize<[Event]>(...)`) to type these parameters as
 *   the method's actual arguments instead of `unknown`.
 */
export type SharedExecutionKeyProviderFn<A extends unknown[] = unknown[]> = (
  ...args: A
) => unknown | PromiseLike<unknown>;

/** An object exposing {@link SharedExecutionKeyProviderFn} as a `get` method. */
export interface SharedExecutionKeyProviderObject<
  A extends unknown[] = unknown[],
> {
  get: SharedExecutionKeyProviderFn<A>;
}

/**
 * A component that computes the key used to share an execution with
 * concurrent callers — either a plain function or an object exposing one
 * as `get` (see {@link SharedExecutionKeyProviderFn}).
 *
 * Two invocations that compute the same key (compared as a `Map` key) on
 * the same receiver share one execution; all others execute independently.
 * A synchronous key preserves the exact same Promise reference for every
 * caller sharing an execution; an asynchronous key still guarantees a
 * single execution and an equal-valued result for every caller, but each
 * caller receives its own Promise wrapper rather than a literal shared
 * reference, since the key must be awaited before the policy can decide
 * whether to join an existing execution.
 *
 * @template A - The decorated method's argument tuple; see
 *   {@link SharedExecutionKeyProviderFn}.
 */
export type SharedExecutionKeyProvider<A extends unknown[] = unknown[]> =
  Component<SharedExecutionKeyProviderObject<A>, 'get'>;

/**
 * Options shared by {@link ExecutionPolicy.shared} and
 * {@link ExecutionPolicy.memoize}.
 *
 * @template A - The decorated method's argument tuple, used to type
 *   `keyProvider`'s parameters; see {@link SharedExecutionKeyProviderFn}.
 */
export type SharedExecutionPolicyOptions<A extends unknown[] = unknown[]> = {
  /**
   * Computes the key used to share an invocation with concurrent callers
   * on the same receiver. Defaults to a single fixed key, so all
   * concurrent calls on a receiver share regardless of arguments.
   */
  keyProvider?: SharedExecutionKeyProvider<A>;
};
