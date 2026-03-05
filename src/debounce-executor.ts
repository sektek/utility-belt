type Timeout = ReturnType<typeof setTimeout>;

export class DebounceExecutor<T = string, K = T> {
  #timeoutMap = new Map<K, Timeout>();

  debounce(key: K, fn: () => void, delay: number) {
    this.clear(key);
    const timeout = setTimeout(() => {
      fn();
      this.#timeoutMap.delete(key);
    }, delay);
    this.#timeoutMap.set(key, timeout);
  }

  clear(key: K) {
    const timeout = this.#timeoutMap.get(key);
    if (timeout) {
      clearTimeout(timeout);
      this.#timeoutMap.delete(key);
    }
  }
}
