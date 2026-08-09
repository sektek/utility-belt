import { SharedExecutionContext, SharedExecutionKeyProvider } from './types.js';

/** The key `singleKeyProvider` returns for every invocation. */
const SINGLE_KEY = Symbol('ExecutionPolicy.singleKey');

/**
 * A key provider that returns the same key for every invocation, so every
 * call on a receiver shares or retains a single execution regardless of
 * arguments.
 *
 * This is `ExecutionPolicy.shared`'s default. Pass it explicitly to
 * `ExecutionPolicy.memoize` to opt into the same whole-method, singleton
 * behavior instead of memoizing per argument.
 *
 * @returns The same key for every invocation.
 */
export const singleKeyProvider: SharedExecutionKeyProvider = () => SINGLE_KEY;

/**
 * A key provider that keys by an invocation's first argument, so calls with
 * the same first argument share or retain one execution and calls with a
 * different first argument execute independently.
 *
 * This is `ExecutionPolicy.memoize`'s default. For a method with no
 * arguments, every call resolves to the same key (`undefined`), so it
 * behaves like `singleKeyProvider`. Keys are compared as `Map` keys: two
 * non-primitive arguments (objects, arrays) are only equal if they're the
 * same reference. For methods with multiple significant arguments, or
 * where argument equality should be structural rather than
 * reference-based, supply a custom `keyProvider` instead.
 *
 * @param context - The invocation's arguments.
 * @returns The invocation's first argument.
 */
export const firstArgumentKeyProvider: SharedExecutionKeyProvider = (
  context: SharedExecutionContext,
) => context.args[0];
