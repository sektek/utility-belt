/**
 * A {@link Promise} returned by {@link sleep} that can be cancelled early.
 * Awaiting it behaves like a normal promise; calling {@link cancel} resolves
 * it immediately and clears the underlying timer.
 */
export type CancellableSleep = Promise<void> & {
  /** Resolves the sleep immediately and clears the underlying timer. */
  cancel: () => void;
};

/**
 * Returns a {@link CancellableSleep} that resolves after the specified number
 * of milliseconds. The returned promise also exposes a `cancel()` method that
 * resolves it early, making it safe to use in contexts where the caller may
 * need to interrupt the wait (e.g. on shutdown).
 *
 * @param ms - Duration to sleep in milliseconds.
 * @returns A cancellable promise that resolves after the given duration.
 *
 * @example
 * ```ts
 * // Simple usage — behaves like a plain sleep
 * await sleep(1000);
 *
 * // Cancellable usage
 * const nap = sleep(60_000);
 * onShutdown(() => nap.cancel());
 * await nap;
 * ```
 */
export const sleep = (ms: number): CancellableSleep => {
  let cancel!: () => void;
  const promise = new Promise<void>(resolve => {
    const timer = setTimeout(resolve, ms);
    cancel = () => {
      clearTimeout(timer);
      resolve();
    };
  });
  return Object.assign(promise, { cancel });
};
