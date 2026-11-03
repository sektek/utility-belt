/**
 * Options for {@link ResourceNotFoundError}.
 */
export type ResourceNotFoundErrorOptions = {
  /** The kind of resource that was requested, e.g. `'Job'`. */
  resource?: string;

  /** The identifier the resource was requested by. */
  id?: unknown;

  /** Overrides the default message. */
  message?: string;

  /** The underlying error, if any. */
  cause?: unknown;
};

/**
 * An error for when a requested resource does not exist. Providers throw this
 * rather than returning `undefined`, leaving the caller's error handler to
 * deal with the missing resource.
 */
export class ResourceNotFoundError extends Error {
  #resource?: string;
  #id?: unknown;

  constructor(opts: ResourceNotFoundErrorOptions = {}) {
    super(opts.message ?? ResourceNotFoundError.#describe(opts), {
      cause: opts.cause,
    });

    this.name = 'ResourceNotFoundError';
    this.#resource = opts.resource;
    this.#id = opts.id;
  }

  static #describe(opts: ResourceNotFoundErrorOptions): string {
    const resource = opts.resource ?? 'Resource';

    return opts.id === undefined
      ? `${resource} not found`
      : `${resource} not found: ${String(opts.id)}`;
  }

  get resource(): string | undefined {
    return this.#resource;
  }

  get id(): unknown {
    return this.#id;
  }
}
