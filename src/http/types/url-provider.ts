import { Provider, ProviderComponent, ProviderFn } from '../../types/index.js';

export type UrlProviderFn<T> = ProviderFn<string, T>;

export interface UrlProvider<T> extends Provider<string, T> {}

export type UrlProviderComponent<T> = ProviderComponent<string, T>;
