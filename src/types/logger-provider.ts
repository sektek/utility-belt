import { Logger, LoggerContext } from './logger.js';
import {
  SyncProvider,
  SyncProviderComponent,
  SyncProviderFn,
} from './sync-provider.js';

export type LoggerProviderOptions<T = void> = {
  /* The context to use for this provider. */
  context?: LoggerContext;
  /* The context providers to use for this provider. */
  contextProviders?: LoggerContextProviderComponent<T>[];
};

export type LoggerContextProviderFn<T = void> = SyncProviderFn<
  LoggerContext,
  T
>;

export interface LoggerContextProvider<T = void> extends SyncProvider<
  LoggerContext,
  T
> {}

export type LoggerContextProviderComponent<T = void> = SyncProviderComponent<
  LoggerContext,
  T
>;

export interface LoggerProvider<T = void> extends SyncProvider<Logger, T> {
  with(
    context: LoggerContext,
    ...contextProviders: LoggerContextProviderComponent<T>[]
  ): LoggerProvider<T>;
}
