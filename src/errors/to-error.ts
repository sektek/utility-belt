import { isError } from '../guards/is-error.js';

/**
 * Returns `thrown` if it is an `Error`, otherwise an `Error` that wraps it as
 * its `cause`. Anything can be thrown or used to reject a promise, but error
 * events promise their listeners an `Error`.
 *
 * @param thrown - The value that was thrown or rejected with.
 * @returns `thrown` itself when it is an `Error`, otherwise a wrapping `Error`.
 */
export function toError(thrown: unknown): Error {
  if (isError(thrown)) {
    return thrown;
  }

  return new Error(String(thrown), { cause: thrown });
}
