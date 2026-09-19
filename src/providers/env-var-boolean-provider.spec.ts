import { expect } from 'chai';

import EnvVarBooleanProvider from './env-var-boolean-provider.js';

describe('EnvVarBooleanProvider', function () {
  const variableName = 'SEKTEK_TEST_ENV_VAR_BOOLEAN_PROVIDER';

  afterEach(function () {
    delete process.env[variableName];
  });

  it('should return true when the environment variable is "true"', function () {
    process.env[variableName] = 'true';
    const provider = new EnvVarBooleanProvider({ variableName });

    expect(provider.get()).to.be.true;
  });

  it('should be case-insensitive when parsing "true"', function () {
    process.env[variableName] = 'TrUe';
    const provider = new EnvVarBooleanProvider({ variableName });

    expect(provider.get()).to.be.true;
  });

  it('should return false when the environment variable is not "true"', function () {
    process.env[variableName] = 'false';
    const provider = new EnvVarBooleanProvider({ variableName });

    expect(provider.get()).to.be.false;

    process.env[variableName] = 'not-a-boolean';
    expect(provider.get()).to.be.false;
  });

  it('should return false by default when the environment variable is not set', function () {
    delete process.env[variableName];
    const provider = new EnvVarBooleanProvider({ variableName });

    expect(provider.get()).to.be.false;
  });

  it('should return the configured default value when the environment variable is not set', function () {
    delete process.env[variableName];
    const provider = new EnvVarBooleanProvider({
      variableName,
      defaultValue: true,
    });

    expect(provider.get()).to.be.true;
  });

  it('should implement test() as an alias for get()', function () {
    process.env[variableName] = 'true';
    const provider = new EnvVarBooleanProvider({ variableName });

    expect(provider.test()).to.be.true;

    process.env[variableName] = 'false';
    expect(provider.test()).to.be.false;
  });
});
