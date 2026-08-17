import { KeyedExecutionPolicyOptions, SettlementOutcome } from './types.js';
import { AbstractSharedExecutionPolicy } from './abstract-shared-execution-policy.js';
import { firstArgumentKeyProvider } from './key-providers.js';

/**
 * Decorates asynchronous methods so each receiver and key executes the
 * method at most once and shares the outcome with every caller.
 *
 * Concurrent calls on the same receiver and key reuse the same execution,
 * as with {@link SharedExecutionPolicy}. Once that execution succeeds, it
 * stays recorded and every later call — concurrent or not — receives the
 * same resolved value without invoking the method again. A rejected
 * execution is cleared instead, so the next call retries.
 *
 * Defaults to `firstArgumentKeyProvider`, so calls are memoized per first
 * argument. Pass `keyProvider: singleKeyProvider` for singleton behavior —
 * one retained execution per receiver regardless of arguments.
 *
 * @template KeyArgs - The wrapped function's argument tuple, used to type
 *   `keyProvider`'s parameters. Defaults to `unknown[]`; supply it
 *   explicitly (e.g. `new MemoizeExecutionPolicy<[Event]>(...)`, or via
 *   `ExecutionPolicy.memoize<[Event]>(...)`) to type a custom `keyProvider`
 *   against the method's real parameters instead of casting inside it.
 */
export class MemoizeExecutionPolicy<
  KeyArgs extends unknown[] = unknown[],
> extends AbstractSharedExecutionPolicy<KeyArgs> {
  /**
   * Creates a memoize execution policy.
   *
   * @param opts - Coalescing-key options.
   */
  constructor(opts: KeyedExecutionPolicyOptions<KeyArgs> = {}) {
    super(opts, firstArgumentKeyProvider);
  }

  protected retain(outcome: SettlementOutcome): boolean {
    return outcome === 'fulfilled';
  }
}
