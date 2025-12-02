import { ExecutableFn } from '../types/index.js';

/**
 * An execution strategy that executes functions in a round-robin fashion.
 * Each time `execute` is called, it invokes the next function in the list,
 * cycling back to the start after reaching the end.
 * While it supports async iterables, it collects all functions before execution.
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
    } else {
      executables = [];
      for await (const fn of fns) {
        executables.push(fn);
      }
    }
    if (executables.length === 0) {
      return;
    }
    this.#lastIndex = (this.#lastIndex + 1) % executables.length;
    await executables[this.#lastIndex](...args);
  }
}
