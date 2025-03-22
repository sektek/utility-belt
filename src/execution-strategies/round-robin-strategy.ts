import { ExecutableFn } from '../types/index.js';

export class RoundRobinStrategy<T extends ExecutableFn = ExecutableFn> {
  #lastIndex = -1;

  async execute(fns: T | T[], ...args: Parameters<T>): Promise<void> {
    const executables = [fns].flat();
    this.#lastIndex = (this.#lastIndex + 1) % executables.length;
    await executables[this.#lastIndex](...args);
  }
}
