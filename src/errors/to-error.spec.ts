import { expect } from 'chai';

import { toError } from './to-error.js';

describe('toError', function () {
  it('should return an Error instance as-is', function () {
    const error = new Error('boom');

    expect(toError(error)).to.equal(error);
  });

  it('should return an Error subclass as-is', function () {
    class CustomError extends Error {}
    const error = new CustomError('boom');

    expect(toError(error)).to.equal(error);
  });

  it('should wrap a string', function () {
    const result = toError('boom');

    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal('boom');
    expect(result.cause).to.equal('boom');
  });

  it('should wrap an object with no message', function () {
    const thrown = { code: 42 };
    const result = toError(thrown);

    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal('[object Object]');
    expect(result.cause).to.equal(thrown);
  });

  it('should wrap undefined', function () {
    const result = toError(undefined);

    expect(result).to.be.instanceOf(Error);
    expect(result.message).to.equal('undefined');
    expect(result.cause).to.be.undefined;
  });

  it('should preserve the thrown value as the cause by reference', function () {
    const thrown = { code: 42 };

    expect(toError(thrown).cause).to.equal(thrown);
  });
});
