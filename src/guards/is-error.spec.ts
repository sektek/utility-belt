import { expect } from 'chai';

import { isError } from './is-error.js';

describe('isError', function () {
  it('should return true for an Error instance', function () {
    expect(isError(new Error('boom'))).to.be.true;
  });

  it('should return true for a subclass of Error', function () {
    class CustomError extends Error {}
    expect(isError(new CustomError('boom'))).to.be.true;
  });

  it('should return true for built-in Error subclasses', function () {
    expect(isError(new TypeError('boom'))).to.be.true;
  });

  it('should return false for a plain object with error-like shape', function () {
    expect(isError({ message: 'boom', name: 'Error' })).to.be.false;
  });

  it('should return false for a string', function () {
    expect(isError('boom')).to.be.false;
  });

  it('should return false for null', function () {
    expect(isError(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isError(undefined)).to.be.false;
  });

  it('should return false for a number', function () {
    expect(isError(42)).to.be.false;
  });
});
