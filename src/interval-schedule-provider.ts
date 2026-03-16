import { Provider } from './types/provider.js';

export type IntervalScheduleProviderOptions = {
  /**
   * The interval in milliseconds between each scheduled time.
   */
  intervalMs: number;
};

export class IntervalScheduleProvider implements Provider<number> {
  #intervalMs: number;
  #lastExecution: number;

  constructor(opts: IntervalScheduleProviderOptions) {
    this.#intervalMs = opts.intervalMs;
    this.#lastExecution = Date.now();
  }

  get(): number {
    const now = Date.now();

    while (this.#lastExecution <= now) {
      this.#lastExecution += this.#intervalMs;
    }

    return this.#lastExecution;
  }
}
