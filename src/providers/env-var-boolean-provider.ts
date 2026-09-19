import { Predicate, Provider } from '../types/index.js';

type EnvVarBooleanProviderOpts = {
  variableName: string;
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

  get(): boolean {
    const value = process.env[this.#variableName];

    if (value === undefined) {
      return this.#defaultValue;
    }

    return value.toLowerCase() === 'true';
  }

  test(): boolean {
    return this.get();
  }
}
