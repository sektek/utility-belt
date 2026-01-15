import { Component } from './component.js';

export type ProcessorFn<I, O> = (input: I) => O | PromiseLike<O>;

export interface Processor<I, O> {
  process: ProcessorFn<I, O>;
}

export type ProcessorComponent<I, O> = Component<Processor<I, O>, 'process'>;
