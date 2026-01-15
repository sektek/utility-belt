import { Component } from './component.js';

export type CommandFn<T = void, R = void> = (arg: T) => R | PromiseLike<R>;

export interface Command<T = void, R = void> {
  execute: CommandFn<T, R>;
}

export type CommandComponent<T = void, R = void> = Component<
  Command<T, R>,
  'execute'
>;
