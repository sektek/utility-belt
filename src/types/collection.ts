import { Collector } from './collector.js';
import { IterableProvider } from './iterable-provider.js';

/**
 * An interface defining an object to both collect and provide items.
 *
 * @template T The type of item to be collected and provided.
 */
export interface Collection<T> extends Collector<T>, IterableProvider<T> {
  /** Clear all items from the collection. */
  clear: () => PromiseLike<void> | void;
}
