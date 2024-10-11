import { Component } from './component.js';

export type ProviderFn<T> = () => T | PromiseLike<T>;

export interface Provider<T> {
  get: ProviderFn<T>;
}

export type ProviderComponent<T> = Component<Provider<T>, 'get'>;
