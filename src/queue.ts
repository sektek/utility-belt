import { Collector } from './types/index.js';

export type QueueOptions = {
  /**
   * Maximum number of items the queue can hold. Default is Infinity.
   */
  maxSize?: number;
  /**
   * Duration in milliseconds to wait before rejecting an add operation when
   * the queue is full. Default is Infinity (i.e., never reject).
   */
  maxWaitAdd?: number;
  /**
   * Duration in milliseconds to wait before forcefully stopping the queue
   * when stop() is called. Default is 5000ms.
   */
  maxWaitStop?: number;
  /**
   * Duration in milliseconds to wait before checking for new items when the
   * queue is empty. Default is 100ms.
   */
  sleepDuration?: number;
  /**
   * Duration in milliseconds to wait before checking if space is available when
   * adding an item to a full queue. Default is to use the value of `sleepDuration`.
   */
  sleepDurationAdd?: number;
  /**
   * Duration in milliseconds to wait before checking if the queue has stopped
   * when stop() is called. Default is to use the value of `sleepDuration`.
   */
  sleepDurationStop?: number;
  /**
   * Whether to automatically stop the queue once it becomes empty.
   * Default is false.
   */
  stopOnEmpty?: boolean;
};

export class Queue<T> implements Collector<T>, AsyncIterable<T> {
  #items: T[] = [];
  #running = true;
  #maxSize: number;
  #maxWaitAdd: number;
  #maxWaitStop: number;
  #sleepDuration: number;
  #sleepDurationAdd: number;
  #sleepDurationStop: number;
  #stopOnEmpty: boolean = false;

  constructor(opts: QueueOptions = {}) {
    if (opts.maxSize !== undefined && opts.maxSize <= 0) {
      throw new Error('maxSize must be greater than 0');
    }
    this.#maxSize = opts.maxSize ?? Infinity;

    if (opts.maxWaitAdd !== undefined && opts.maxWaitAdd <= 0) {
      throw new Error('maxWaitAdd must be a non-negative number');
    }
    this.#maxWaitAdd = opts.maxWaitAdd ?? Infinity;

    if (opts.maxWaitStop !== undefined && opts.maxWaitStop <= 0) {
      throw new Error('maxWaitStop must be a non-negative number');
    }
    this.#maxWaitStop = opts.maxWaitStop ?? 5000;

    if (opts.sleepDuration !== undefined && opts.sleepDuration <= 0) {
      throw new Error('sleepDuration must be a non-negative number');
    }
    this.#sleepDuration = opts.sleepDuration ?? 100;

    if (opts.sleepDurationAdd !== undefined && opts.sleepDurationAdd <= 0) {
      throw new Error('sleepDurationAdd must be a non-negative number');
    }
    this.#sleepDurationAdd = opts.sleepDurationAdd ?? this.#sleepDuration;

    if (opts.sleepDurationStop !== undefined && opts.sleepDurationStop <= 0) {
      throw new Error('sleepDurationStop must be a non-negative number');
    }
    this.#sleepDurationStop = opts.sleepDurationStop ?? this.#sleepDuration;

    this.#stopOnEmpty = opts.stopOnEmpty ?? false;
  }

  async add(item: T): Promise<void> {
    if (this.#items.length >= this.#maxSize) {
      const startTime = Date.now();
      while (this.#items.length >= this.#maxSize && this.#running) {
        if (Date.now() - startTime >= this.#maxWaitAdd) {
          if (this.#maxWaitAdd <= 0) {
            throw new Error('Queue is full.');
          }
          throw new Error('Queue is full and max wait time exceeded');
        }
        await new Promise(resolve =>
          setTimeout(resolve, this.#sleepDurationAdd),
        );
      }
    }

    if (!this.#running) {
      throw new Error('Cannot add items to a stopped queue');
    }

    this.#items.push(item);
  }

  start() {
    this.#running = true;
  }

  /**
   * Stops the queue from accepting new items and waits for the queue to be
   * empty before resolving. If the queue does not become empty within the
   * maxWaitStop duration, an error is thrown.
   *
   * @throws {Error} If the queue does not become empty within the maxWaitStop
   *  duration.
   */
  async stop() {
    this.#running = false;
    const startTime = Date.now();
    while (this.#items.length > 0) {
      if (Date.now() - startTime >= this.#maxWaitStop) {
        throw new Error('Queue stop timeout exceeded');
      }
      await new Promise(resolve =>
        setTimeout(resolve, this.#sleepDurationStop),
      );
    }
  }

  async *[Symbol.asyncIterator]() {
    while (this.#running || this.#items.length > 0) {
      if (this.#items.length > 0) {
        yield this.#items.shift() as T;
      } else {
        if (this.#stopOnEmpty) {
          await this.stop();
        } else {
          await new Promise(resolve =>
            setTimeout(resolve, this.#sleepDuration),
          );
        }
      }
    }
  }
}
