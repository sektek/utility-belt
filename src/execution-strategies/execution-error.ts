/**
 * An error that occurs during the execution of a collection of Promises.
 * This error can contain a single cause or multiple causes.
 */
export class ExecutionError extends Error {
  #cause?: Error | Error[];

  /**
   * @param message - The error message.
   * @param cause - The cause of the error. Can be a single Error or an array of Errors.
   */
  constructor(cause?: Error | Error[]) {
    super('Multiple errors occurred during execution.');
    this.name = 'ExecutionError';
    this.#cause = cause;
  }

  get causes(): Error[] {
    return this.#cause ? [this.#cause].flat() : [];
  }
}
