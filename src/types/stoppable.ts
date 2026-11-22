import { CommandFn } from './command.js';
import { ErrorHandlerFn } from './error-handler.js';

export interface Stoppable {
  stop: CommandFn;
}

/** Event emitted when `stop()` completes successfully. */
export const SERVICE_STOPPED = 'service:stopped';

/** Event emitted when `stop()` fails. */
export const SERVICE_STOP_ERROR = 'service:stopError';

/**
 * Lifecycle events emitted by a {@link Stoppable}.
 *
 * - `service:stopped`: `stop()` completed successfully.
 * - `service:stopError`: `stop()` failed. The listener receives the original error.
 */
export type StoppableEvents = {
  [SERVICE_STOPPED]: () => void;
  [SERVICE_STOP_ERROR]: ErrorHandlerFn;
};
