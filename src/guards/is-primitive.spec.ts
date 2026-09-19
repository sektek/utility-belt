import { expect } from 'chai';

import { isPrimitive } from './is-primitive.js';

describe('isPrimitive', function () {
  it('should return true for a string', function () {
    expect(isPrimitive('')).to.be.true;
  });

  it('should return true for a number', function () {
    expect(isPrimitive(1)).to.be.true;
  });

  it('should return true for a boolean', function () {
    expect(isPrimitive(true)).to.be.true;
  });

  it('should return true for a symbol', function () {
    expect(isPrimitive(Symbol())).to.be.true;
  });

  it('should return true for null', function () {
    expect(isPrimitive(null)).to.be.true;
  });

  it('should return true for undefined', function () {
    expect(isPrimitive(undefined)).to.be.true;
  });

  it('should return false for an object', function () {
    expect(isPrimitive({})).to.be.false;
  });

  it('should return false for an array', function () {
    expect(isPrimitive([])).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isPrimitive(() => {})).to.be.false;
  });
});
