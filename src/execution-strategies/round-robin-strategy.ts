import { ExecutableFn } from '../types/index.js';

/**
 * An execution strategy that executes functions in a round-robin fashion.
 * Each time `execute` is called, it invokes the next function in the list,
 * cycling back to the start after reaching the end.
 * While it supports async iterables, it collects all functions
 * before execution. Therefore, it is not suitable for infinite iterables.
 *
 * @remarks
 * **Memory usage warning:** If you pass a very large or infinite async
 * iterable to `execute`, this strategy will attempt to collect all items
 * into memory before executing any. This may lead to high memory usage or
 * out-of-memory errors. Ensure that the iterable is reasonably sized.
 */
export class RoundRobinStrategy<T extends ExecutableFn = ExecutableFn> {
  #lastIndex = -1;

  async execute(
    fns: Iterable<T> | AsyncIterable<T>,
    ...args: Parameters<T>
  ): Promise<void> {
    let executables: T[];
    if (Array.isArray(fns)) {
      executables = fns;
    } else if (Symbol.asyncIterator in Object(fns)) {
      executables = [];
      for await (const fn of fns) {
        executables.push(fn);
      }
    } else {
      // Synchronous iterable - use Array.from
      executables = Array.from(fns as Iterable<T>);
    }
    if (executables.length === 0) {
      return;
    }
    this.#lastIndex = (this.#lastIndex + 1) % executables.length;
    await executables[this.#lastIndex](...args);
  }
}
