/**
 * A utility class to manage a set of executing promises,
 * allows for adding and deleting promises as a normal Set would,
 * but also allows for "deleting" promises that were never added,
 * preventing them from being added in the future.
 */
export class ExecutionSet {
  #executing: Set<Promise<unknown>> = new Set();
  #deletedExecuting: Set<Promise<unknown>> = new Set();

  add(promise: Promise<unknown>) {
    if (this.#deletedExecuting.has(promise)) {
      this.#deletedExecuting.delete(promise);
      return;
    }

    this.#executing.add(promise);
  }

  delete(promise: Promise<unknown>) {
    if (this.#executing.has(promise)) {
      this.#executing.delete(promise);
      return;
    }

    this.#deletedExecuting.add(promise);
  }

  get size(): number {
    return this.#executing.size;
  }

  [Symbol.iterator]() {
    return this.#executing[Symbol.iterator]();
  }
}
