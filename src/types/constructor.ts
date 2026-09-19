/**
 * A type representing a constructor function for a class.
 *
 * @template T The type of the instance created by the constructor.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Constructor<T> = new (...args: any[]) => T;
