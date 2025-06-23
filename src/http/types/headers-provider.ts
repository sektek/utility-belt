import { Provider, ProviderComponent, ProviderFn } from '../../types/index.js';

type HeadersInit = Headers | [string, string][] | Record<string, string>;

export type HeadersProviderFn<T = unknown> = ProviderFn<HeadersInit, T>;

export interface HeadersProvider<T = unknown>
  extends Provider<HeadersInit, T> {}

export type HeadersProviderComponent<T = unknown> = ProviderComponent<
  HeadersInit,
  T
>;
