/**
 * Options for components that can be stopped.
 */
export type StoppableOptions = {
  /**
   * Maximum time in milliseconds each individual service is allowed to take
   * to complete its `stop()` call. Rejects with an error if any single
   * service exceeds this deadline.
   * Defaults to `Infinity` (no timeout).
   */
  maxStopWaitMs?: number;
};
