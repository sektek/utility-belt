/**
 * Options for components that can be started.
 */
export type StartableOptions = {
  /**
   * Maximum time in milliseconds each individual service is allowed to take
   * to complete its `start()` call. Rejects with an error if any single
   * service exceeds this deadline.
   * Defaults to `Infinity` (no timeout).
   */
  maxStartWaitMs?: number;
};
