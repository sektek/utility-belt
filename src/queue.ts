/**
 * Options for configuring the behavior of the Queue.
 */
export type QueueOptions = {
  /**
   * Maximum time in milliseconds to wait when the queue is full before
   * throwing an error. Defaults to Infinity.
   */
  maxQueueWaitTime?: number;

  /**
   * Maximum number of items allowed in the queue. Defaults to Infinity.
   */
  maxSize?: number;

  /**
   * Maximum time in milliseconds to wait for the queue to empty when stopping
   * before forcefully stopping. Defaults to Infinity.
   */
  maxStopWaitTime?: number;

  /**
   * Time in milliseconds to wait between checks when the queue is full
   * when adding items. Defaults to 100ms.
   */
  queueSleepTime?: number;

  /**
   * Whether a call to start() is required before items can be added to the
   * queue or it can be used immediately.
   * Defaults to false (i.e., the queue starts immediately).
   */
  requireStart?: boolean;

  /**
   * Time in milliseconds to wait between checks when the queue is empty.
   * Defaults to 100ms.
   */
  sleepTime?: number;
};

const DEFAULT_MAX_QUEUE_WAIT_TIME = Infinity;
const DEFAULT_MAX_SIZE = Infinity;
const DEFAULT_MAX_STOP_WAIT_TIME = Infinity;
const DEFAULT_SLEEP_TIME = 100;

/**
 * A simple asynchronous queue implementation that allows for adding items and
 * iterating over them asynchronously.
 *
 * @see QueueOptions for more details on configuration options.
 */
export class Queue<T> {
  #maxQueueWaitTime: number;
  #maxSize: number;
  #maxStopWaitTime: number;
  #queue: T[] = [];
  #queueSleepTime: number;
  #running = false;
  #sleepTime: number;

  constructor(opts: QueueOptions = {}) {
    this.#maxQueueWaitTime =
      opts.maxQueueWaitTime ?? DEFAULT_MAX_QUEUE_WAIT_TIME;
    this.#maxSize = opts.maxSize ?? DEFAULT_MAX_SIZE;
    this.#maxStopWaitTime = opts.maxStopWaitTime ?? DEFAULT_MAX_STOP_WAIT_TIME;
    this.#queueSleepTime =
      opts.queueSleepTime ?? opts.sleepTime ?? DEFAULT_SLEEP_TIME;
    this.#sleepTime = opts.sleepTime ?? DEFAULT_SLEEP_TIME;
    if (!opts.requireStart) {
      this.start();
    }
  }

  /**
   * Starts the queue, allowing items to be added and iterated over.
   * If the queue is already running, this method does nothing.
   */
  start() {
    if (this.#running) {
      return;
    }

    this.#running = true;
  }

  /**
   * Stops the queue, preventing new items from being added and allowing the
   * iterator to finish iterating over existing items. If the queue is already
   * stopped, this method does nothing. This method will wait for the queue to
   * empty before fully stopping, but will force stop after a certain amount of
   * time (configured by maxStopWaitTime) to prevent hanging indefinitely.
   */
  async stop() {
    if (!this.#running) {
      return;
    }

    this.#running = false;
    let waitedTime = 0;
    while (this.#queue.length > 0 && waitedTime < this.#maxStopWaitTime) {
      await new Promise(resolve => setTimeout(resolve, this.#sleepTime));
      waitedTime += this.#sleepTime;
    }
  }

  /**
   * Adds an item to the queue. If the queue is full, this method will wait until
   * there is space in the queue before adding the item, but will throw an error
   * if it waits too long (configured by maxQueueWaitTime) to prevent hanging
   * indefinitely. If the queue is not running, this method will throw an error.
   *
   * @param item The item to add to the queue.
   * @throws Error if the queue is not running or if the queue is
   *   full and maxQueueWaitTime is exceeded.
   */
  async add(item: T) {
    if (!this.#running) {
      throw new Error('Queue is not running');
    }

    let waitedTime = 0;
    while (
      this.#queue.length >= this.#maxSize &&
      waitedTime < this.#maxQueueWaitTime
    ) {
      await new Promise(resolve => setTimeout(resolve, this.#queueSleepTime));
      waitedTime += this.#queueSleepTime;
    }

    if (this.#queue.length >= this.#maxSize) {
      throw new Error('Queue is full');
    }

    this.#queue.push(item);
  }

  /**
   * Asynchronously iterates over items in the queue. This iterator will yield items
   * in the order they were added to the queue. If the queue is empty, this iterator
   * will wait until there are items in the queue before yielding, but will stop
   * iterating if the queue is stopped and there are no more items to yield.
   */
  async *[Symbol.asyncIterator]() {
    while (this.#running || this.#queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, this.#sleepTime));
    }

    while (this.#queue.length > 0) {
      yield this.#queue.shift() as T;
    }
  }
}
