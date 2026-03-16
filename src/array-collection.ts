import { Collection } from './types/collection.js';

/**
 * A simple implementation of a collection that stores items in an array.
 *
 * @template T The type of item to be collected and provided.
 */
export class ArrayCollection<T> implements Collection<T> {
  #items: T[] = [];

  add(item: T) {
    this.#items.push(item);
  }

  clear() {
    this.#items.length = 0;
    this.#items = [];
  }

  values(): Iterable<T> {
    return this.#items[Symbol.iterator]();
  }
}
