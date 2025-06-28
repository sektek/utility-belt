import { Provider, ProviderComponent, ProviderFn } from '../../types/index.js';
import { HeadersInit } from 'undici-types';

export type HeadersProviderFn<T = unknown> = ProviderFn<HeadersInit, T>;

export interface HeadersProvider<T = unknown>
  extends Provider<HeadersInit, T> {}

export type HeadersProviderComponent<T = unknown> = ProviderComponent<
  HeadersInit,
  T
>;
