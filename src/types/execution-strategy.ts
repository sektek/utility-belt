import { Component } from './component.js';

export type ExecutableFn = (
  ...args: unknown[]
) => Promise<void | unknown> | unknown | void;

export type ExecutionStrategyFn<T extends ExecutableFn> = (
  fns: T[],
  ...args: Parameters<T>
) => PromiseLike<unknown | void> | unknown | void;

export interface ExecutionStrategy<T extends ExecutableFn = ExecutableFn> {
  execute: ExecutionStrategyFn<T>;
}

export type ExecutionStrategyComponent<T extends ExecutableFn = ExecutableFn> =
  Component<ExecutionStrategy<T>, 'execute'>;
