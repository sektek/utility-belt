import { CommandFn } from './command.js';
import { ErrorHandlerFn } from './error-handler.js';

export interface Startable {
  start: CommandFn;
}

/** Event emitted when `start()` completes successfully. */
export const SERVICE_STARTED = 'service:started';

/** Event emitted when `start()` fails. */
export const SERVICE_START_ERROR = 'service:startError';

/**
 * Lifecycle events emitted by a {@link Startable}.
 *
 * - `service:started`: `start()` completed successfully.
 * - `service:startError`: `start()` failed. The listener receives the original error.
 */
export type StartableEvents = {
  [SERVICE_STARTED]: () => void;
  [SERVICE_START_ERROR]: ErrorHandlerFn;
};
