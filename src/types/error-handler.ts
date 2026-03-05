import { Component } from './component.js';

export type ErrorHandlerFn<T = void> = (
  error: Error,
  context?: T,
) => void | PromiseLike<void>;

export interface ErrorHandler<T = void> {
  handle: ErrorHandlerFn<T>;
}

export type ErrorHandlerComponent<T = void> = Component<
  ErrorHandler<T>,
  'handle'
>;
