import { OptionalProvider } from '../types/index.js';

/**
 * Options for creating an EnvVarOptionalProvider.
 */
type EnvVarOptionalProviderOpts = {
  /** The name of the environment variable to read. */
  variableName: string;
};

/**
 * Provides a string value read from an environment variable, resolving to
 * `undefined` if it is not set.
 */
export class EnvVarOptionalProvider implements OptionalProvider<string> {
  #variableName: string;

  constructor(opts: EnvVarOptionalProviderOpts) {
    this.#variableName = opts.variableName;
  }

  /**
   * @returns The value of the environment variable, or `undefined` if it
   *   is not set.
   */
  get(): string | undefined {
    return process.env[this.#variableName];
  }
}
