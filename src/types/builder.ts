import { Provider, ProviderFn } from './provider.js';

export interface Builder<T> extends Provider<T> {
  create: ProviderFn<T>;
}
