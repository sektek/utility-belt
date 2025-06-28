import { RequestInfo } from 'undici-types';

import { Provider, ProviderComponent, ProviderFn } from '../../types/index.js';

export type UrlProviderFn<T> = ProviderFn<RequestInfo, T>;

export interface UrlProvider<T> extends Provider<RequestInfo, T> {}

export type UrlProviderComponent<T> = ProviderComponent<RequestInfo, T>;
