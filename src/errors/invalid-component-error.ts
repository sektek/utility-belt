/**
 * An error for when a component is unable to be created.
 */
export class InvalidComponentError extends Error {
  #component: unknown;

  constructor(component: unknown, message?: string) {
    super(message ?? 'Invalid component');

    this.name = 'InvalidComponentError';
    this.#component = component;
  }

  get component(): unknown {
    return this.#component;
  }
}
