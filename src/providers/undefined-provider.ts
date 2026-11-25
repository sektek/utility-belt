import { OptionalProvider } from '../types/index.js';

/**
 * A Null Object optional provider that always resolves to `undefined`. It is
 * the default for optional provider slots where no provider is configured.
 *
 * @template R - The type of the value the provider would otherwise return.
 * @template T - The type of the argument passed to the provider.
 */
export class UndefinedProvider<
  R = unknown,
  T = void,
> implements OptionalProvider<R, T> {
  /**
   * Resolves to `undefined`, ignoring any context.
   *
   * @returns A promise resolving to `undefined`.
   */
  async get(): Promise<undefined> {
    return undefined;
  }
}
