import { expect } from 'chai';

import EnvVarOptionalProvider from './env-var-optional-provider.js';

describe('EnvVarOptionalProvider', function () {
  const variableName = 'SEKTEK_TEST_ENV_VAR_OPTIONAL_PROVIDER';

  afterEach(function () {
    delete process.env[variableName];
  });

  it('should return the value of the environment variable', function () {
    process.env[variableName] = 'a value';
    const provider = new EnvVarOptionalProvider({ variableName });

    expect(provider.get()).to.equal('a value');
  });

  it('should return undefined when the environment variable is not set', function () {
    delete process.env[variableName];
    const provider = new EnvVarOptionalProvider({ variableName });

    expect(provider.get()).to.be.undefined;
  });
});
