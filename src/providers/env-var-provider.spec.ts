import { expect } from 'chai';

import EnvVarProvider from './env-var-provider.js';

describe('EnvVarProvider', function () {
  const variableName = 'SEKTEK_TEST_ENV_VAR_PROVIDER';

  afterEach(function () {
    delete process.env[variableName];
  });

  it('should return the value of the environment variable', function () {
    process.env[variableName] = 'a value';
    const provider = new EnvVarProvider({ variableName });

    expect(provider.get()).to.equal('a value');
  });

  it('should throw when the environment variable is not set', function () {
    delete process.env[variableName];
    const provider = new EnvVarProvider({ variableName });

    expect(() => provider.get()).to.throw(
      `Environment variable ${variableName} is not set`,
    );
  });
});
