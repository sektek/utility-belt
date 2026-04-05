import { LoggerProvider } from './types/logger-provider.js';
import { NullLoggerProvider } from './null-logger-provider.js';

const COMPONENT_NAME_IDS = new Map<string, number>();

const generateName = (prefix: string): string => {
  const id = COMPONENT_NAME_IDS.get(prefix) || 0;
  COMPONENT_NAME_IDS.set(prefix, id + 1);

  return `${prefix}#${id}`;
};

/**
 * Options for {@link AbstractComponent}.
 *
 * @template T - The type of object passed to the logger provider's `get()`
 *               method. Defaults to `void`.
 */
export type ComponentOptions<T = void> = {
  /** Logger provider used to create loggers for this component. Defaults to {@link NullLoggerProvider}. */
  loggerProvider?: LoggerProvider<T>;
  /**
   * Human-readable name for this component. When omitted, a name is
   * auto-generated as `ClassName#N` where N increments per class.
   */
  name?: string;
};

/**
 * Base class for named, logger-aware components.
 *
 * Provides two shared concerns for all derived classes:
 * - **Name** — a stable identifier used in log output and diagnostics. Supplied
 *   via `opts.name`; if omitted, a unique name is auto-generated as
 *   `ClassName#N` where N increments independently per class.
 * - **Logger** — delegates to a {@link LoggerProvider} so callers can inject
 *   any logger implementation. Defaults to {@link NullLoggerProvider} so
 *   components are safe to use without explicit logger configuration.
 *
 * @template T - The type of object passed to {@link AbstractComponent.logger}
 *               and forwarded to the logger provider. Defaults to `void`.
 */
export abstract class AbstractComponent<T = void> {
  #name: string;
  #loggerProvider: LoggerProvider<T>;

  constructor(opts: ComponentOptions<T> = {}) {
    this.#name = opts.name ?? generateName(this.constructor.name);
    this.#loggerProvider = opts.loggerProvider ?? new NullLoggerProvider();
  }

  /**
   * The component's name. Auto-generated as `ClassName#N` if not set in options.
   *
   * @returns The component name string.
   */
  get name(): string {
    return this.#name;
  }

  /**
   * Returns a logger for the given object by delegating to the logger provider.
   *
   * @param obj - Forwarded to {@link LoggerProvider.get} to allow per-call context.
   * @returns A logger scoped to this component and the provided object.
   */
  logger(obj: T) {
    return this.#loggerProvider.get(obj);
  }

  /**
   * The logger provider used by this component.
   *
   * @returns The component's {@link LoggerProvider}.
   */
  get loggerProvider(): LoggerProvider<T> {
    return this.#loggerProvider;
  }
}
