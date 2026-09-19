import { Provider } from '../types/index.js';

/**
 * Options for creating an EnvVarProvider.
 */
type EnvVarProviderOpts = {
  /** The name of the environment variable to read. */
  variableName: string;
};

/**
 * Provides a string value read from an environment variable, throwing if
 * it is not set.
 */
export class EnvVarProvider implements Provider<string> {
  #variableName: string;

  constructor(opts: EnvVarProviderOpts) {
    this.#variableName = opts.variableName;
  }

  /**
   * @returns The value of the environment variable.
   * @throws {Error} If the environment variable is not set.
   */
  get(): string {
    const value = process.env[this.#variableName];

    if (value === undefined) {
      throw new Error(`Environment variable ${this.#variableName} is not set`);
    }

    return value;
  }
}
