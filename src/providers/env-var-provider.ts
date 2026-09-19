import { Provider } from '../types/index.js';

class EnvVarProvider implements Provider<string> {
  #variableName: string;

  constructor(opts: { variableName: string }) {
    this.#variableName = opts.variableName;
  }

  get(): string {
    const value = process.env[this.#variableName];

    if (value === undefined) {
      throw new Error(`Environment variable ${this.#variableName} is not set`);
    }

    return value;
  }
}

export default EnvVarProvider;
