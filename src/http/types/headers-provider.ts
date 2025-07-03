import {
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '../../types/index.js';
import { HeadersInit } from 'undici-types';

export type HeadersProviderFn<T = unknown> = OptionalProviderFn<HeadersInit, T>;

export interface HeadersProvider<T = unknown>
  extends OptionalProvider<HeadersInit, T> {}

export type HeadersProviderComponent<T = unknown> = OptionalProviderComponent<
  HeadersInit,
  T
>;
