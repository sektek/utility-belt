import { AbstractSharedExecutionPolicy } from './abstract-shared-execution-policy.js';
import { SharedExecutionPolicyOptions } from './types.js';
import { singleKeyProvider } from './key-providers.js';

/**
 * Decorates asynchronous methods to share in-flight executions.
 *
 * Concurrent calls on the same receiver and key reuse the same execution.
 * The recorded execution is always cleared once it settles, whether it
 * fulfills or rejects, so the next call — even immediately after — starts a
 * new execution. For an execution that stays shared with future callers
 * after it succeeds, see {@link MemoizeExecutionPolicy}.
 *
 * Defaults to `singleKeyProvider`, so all concurrent calls on a receiver
 * share regardless of arguments.
 *
 * @template KeyArgs - The decorated method's argument tuple, used to type
 *   `keyProvider`'s parameters. Defaults to `unknown[]`; supply it
 *   explicitly (e.g. `new SharedExecutionPolicy<[Event]>(...)`, or via
 *   `ExecutionPolicy.shared<[Event]>(...)`) to type a custom `keyProvider`
 *   against the method's real parameters instead of casting inside it.
 */
export class SharedExecutionPolicy<
  KeyArgs extends unknown[] = unknown[],
> extends AbstractSharedExecutionPolicy<KeyArgs> {
  /**
   * Creates a shared execution policy.
   *
   * @param opts - Coalescing-key options.
   */
  constructor(opts: SharedExecutionPolicyOptions<KeyArgs> = {}) {
    super(opts, singleKeyProvider);
  }

  protected retain(): boolean {
    return false;
  }
}
