import {
  OptionalProvider,
  OptionalProviderComponent,
  OptionalProviderFn,
} from '../../types/index.js';
import { HeadersInit } from 'undici-types';

export type HeadersProviderFn<T = void> = OptionalProviderFn<HeadersInit, T>;

export interface HeadersProvider<T = void> extends OptionalProvider<
  HeadersInit,
  T
> {}

export type HeadersProviderComponent<T = void> = OptionalProviderComponent<
  HeadersInit,
  T
>;
