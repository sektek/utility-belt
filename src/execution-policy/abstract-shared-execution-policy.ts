import {
  KeyedExecutionPolicyOptions,
  SettlementOutcome,
  SharedExecutionKeyProviderFn,
} from './types.js';
import { AbstractExecutionPolicy } from './abstract-execution-policy.js';
import { AnyAsyncMethod } from './async-method.js';
import { SharedMethodExecution } from './shared-method.js';
import { getComponent } from '../get-component.js';

/**
 * Base class for policies that share method executions per receiver and
 * key: {@link SharedExecutionPolicy} and {@link MemoizeExecutionPolicy}.
 *
 * Resolves `keyProvider` and builds a {@link SharedMethodExecution} per
 * wrapped function. A concrete subclass only decides, via `retain`,
 * whether a settled execution stays recorded for future callers or is
 * cleared so the next call executes again.
 *
 * @template KeyArgs - The wrapped function's argument tuple, used to type
 *   `keyProvider`'s parameters.
 */
export abstract class AbstractSharedExecutionPolicy<
  KeyArgs extends unknown[] = unknown[],
> extends AbstractExecutionPolicy {
  #keyProvider: SharedExecutionKeyProviderFn<KeyArgs>;

  /**
   * Creates a shared execution policy.
   *
   * @param opts - Coalescing-key options.
   * @param defaultKeyProvider - The key provider used when
   *   `opts.keyProvider` is omitted.
   */
  constructor(
    opts: KeyedExecutionPolicyOptions<KeyArgs>,
    defaultKeyProvider: SharedExecutionKeyProviderFn,
  ) {
    super();
    this.#keyProvider = getComponent(opts.keyProvider, 'get', {
      name: 'keyProvider',
      default: defaultKeyProvider,
    });
  }

  /**
   * Creates a {@link SharedMethodExecution} for a wrapped function, using
   * this policy's `keyProvider` and `retain` rule.
   *
   * @param method - The original wrapped function, type-erased.
   * @returns The function that replaces it.
   */
  protected createExecutor(method: AnyAsyncMethod): AnyAsyncMethod {
    const execution = new SharedMethodExecution(
      method,
      this.#keyProvider.bind(this) as SharedExecutionKeyProviderFn,
      this.retain.bind(this),
    );
    return function (this: unknown, ...args: unknown[]): Promise<unknown> {
      return execution.invoke(this, args);
    };
  }

  /**
   * Determines whether a settled execution's entry is kept recorded for
   * future callers to reuse, or cleared so the next call executes again.
   *
   * @param outcome - Whether the execution fulfilled or rejected.
   * @returns `true` to keep the execution recorded.
   */
  protected abstract retain(outcome: SettlementOutcome): boolean;
}
