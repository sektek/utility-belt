/**
 * An error that occurs during the execution of a collection of Promises.
 * This error can contain a single cause or multiple causes.
 */
export class ExecutionError extends AggregateError {
  /**
   * @param cause - The cause of the error. Can be a single Error or an array of Errors.
   */
  constructor(cause?: Error | Error[]) {
    super([cause].flat(), 'One or more errors occurred during execution.');
    this.name = 'ExecutionError';
  }
}
