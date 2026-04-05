import { Logger, LoggerContext } from './types/logger.js';
import {
  LoggerContextProviderComponent,
  LoggerContextProviderFn,
  LoggerProvider,
  LoggerProviderOptions,
} from './types/logger-provider.js';

import { getComponent } from './get-component.js';

/**
 * Options for {@link DefaultLoggerProvider}.
 *
 * Extends {@link LoggerProviderOptions} with a required `logger` instance.
 *
 * @template T - The type of object passed to `get()` and context providers.
 *               Defaults to `void` when no per-call context is needed.
 */
export type DefaultLoggerProviderOptions<T = void> =
  LoggerProviderOptions<T> & {
    /** The base logger used to create child loggers. */
    logger: Logger;
  };

/**
 * A {@link LoggerProvider} that derives child loggers from a base {@link Logger}.
 *
 * On each call to `get()`, the provider merges its static `context` with any
 * context returned by its `contextProviders`, then calls `logger.child()` with
 * the result. Context providers are called with the object passed to `get()`,
 * allowing per-call context to be injected dynamically.
 *
 * Use {@link DefaultLoggerProvider.with} to create a derived provider that
 * inherits the current context and providers while adding new ones. The
 * original provider is never mutated.
 *
 * @template T - The type of object passed to `get()` and context providers.
 *               Defaults to `void` when no per-call context is needed.
 *
 * @example
 * const provider = new DefaultLoggerProvider({
 *   logger,
 *   context: { service: 'my-service' },
 *   contextProviders: [req => ({ requestId: req.id })],
 * });
 *
 * const logger = provider.get(request); // logger.child({ service: 'my-service', requestId: '...' })
 */
export class DefaultLoggerProvider<T = void> implements LoggerProvider<T> {
  #logger: Logger;
  #context: LoggerContext;
  #contextProviders: LoggerContextProviderFn<T>[];

  constructor(opts: DefaultLoggerProviderOptions<T>) {
    this.#logger = opts.logger;
    this.#context = opts.context ?? {};
    this.#contextProviders = (opts.contextProviders ?? []).map(provider =>
      getComponent(provider, 'get'),
    );
  }

  /**
   * Returns a new provider that inherits this provider's logger, context, and
   * context providers, merged with the supplied `context` and any additional
   * `contextProviders`.
   *
   * The original provider is not modified.
   *
   * @param context - Static context to merge into the new provider.
   * @param contextProviders - Additional context providers appended after the
   *   existing ones.
   * @returns A new {@link DefaultLoggerProvider} with the merged configuration.
   */
  with(
    context: LoggerContext,
    ...contextProviders: LoggerContextProviderComponent<T>[]
  ): LoggerProvider<T> {
    return new DefaultLoggerProvider({
      logger: this.#logger,
      context: {
        ...this.#context,
        ...context,
      },
      contextProviders: [
        ...this.#contextProviders,
        ...contextProviders.map(provider => getComponent(provider, 'get')),
      ],
    });
  }

  /**
   * Returns a child logger with the merged context for the given `obj`.
   *
   * Static context is applied first; context provider results are applied on
   * top in declaration order, so later providers can override earlier ones.
   *
   * @param obj - Passed to each context provider to allow per-call context.
   * @returns A child logger with the fully merged context applied.
   */
  get(obj: T): Logger {
    let context = {};

    for (const provider of this.#contextProviders) {
      context = {
        ...context,
        ...provider(obj),
      };
    }

    return this.#logger.child({
      ...this.#context,
      ...context,
    });
  }
}
