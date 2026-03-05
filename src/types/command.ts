import { Component } from './component.js';

/**
 * A function that represents a command, which takes an argument of type T
 * and returns a result of type R or a Promise that resolves to R.
 */
// The intent for R is to eventually support Undoable Commands
export type CommandFn<T = void, R = void> = (arg: T) => R | PromiseLike<R>;

/**
 * An interface representing a command, which has an execute method
 * that takes an argument of type T and returns a result of type R or
 * a Promise that resolves to R.
 */
export interface Command<T = void, R = void> {
  execute: CommandFn<T, R>;
}

export type CommandComponent<T = void, R = void> = Component<
  Command<T, R>,
  'execute'
>;
