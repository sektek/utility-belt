import { OptionalProvider } from '../types/index.js';

class EnvVarOptionalProvider implements OptionalProvider<string> {
  #variableName: string;

  constructor(opts: { variableName: string }) {
    this.#variableName = opts.variableName;
  }

  get(): string | undefined {
    return process.env[this.#variableName];
  }
}

export default EnvVarOptionalProvider;
