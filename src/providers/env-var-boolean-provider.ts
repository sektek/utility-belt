import { Predicate, Provider } from '../types/index.js';

/**
 * Options for creating an EnvVarBooleanProvider.
 */
type EnvVarBooleanProviderOpts = {
  /** The name of the environment variable to read. */
  variableName: string;
  /**
   * The value returned when the environment variable is not set.
   * Defaults to `false`.
   */
  defaultValue?: boolean;
};

/**
 * Provides a boolean value from an environment variable, with an optional default value.
 */
export class EnvVarBooleanProvider
  implements Provider<boolean>, Predicate<boolean>
{
  #variableName: string;
  #defaultValue: boolean;

  constructor(opts: EnvVarBooleanProviderOpts) {
    this.#variableName = opts.variableName;
    this.#defaultValue = opts.defaultValue ?? false;
  }

  /**
   * @returns `true` if the environment variable's value (case-insensitive)
   *   is `"true"`; otherwise `false`, or the configured `defaultValue` if
   *   the variable is not set.
   */
  get(): boolean {
    const value = process.env[this.#variableName];

    if (value === undefined) {
      return this.#defaultValue;
    }

    return value.toLowerCase() === 'true';
  }

  /**
   * Alias for {@link get}, allowing this provider to be used as a
   * predicate.
   *
   * @returns The same result as {@link get}.
   */
  test(): boolean {
    return this.get();
  }
}
