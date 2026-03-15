import {
  SyncProvider,
  SyncProviderComponent,
  SyncProviderFn,
} from './sync-provider.js';
import { Logger } from './logger.js';

export type LoggerContextProviderFn<T = void> = SyncProviderFn<
  Record<string, unknown>,
  T
>;

export interface LoggerContextProvider<T = void> extends SyncProvider<
  Record<string, unknown>,
  T
> {}

export type LoggerContextProviderComponent<T = void> = SyncProviderComponent<
  LoggerContextProvider<T>,
  'get'
>;

export interface LoggerProvider<T = void> extends SyncProvider<Logger, T> {
  with(
    context: Record<string, unknown>,
    ...contextProviders: LoggerContextProviderComponent<T>[]
  ): LoggerProvider<T>;
}
