import { expect } from 'chai';

import { isA } from './is-a.js';

describe('isA', function () {
  it('should return true for an object with a function', function () {
    expect(isA({ fn: () => {} }, 'fn')).to.be.true;
  });

  it('should return false for an object without a function', function () {
    expect(isA({}, 'fn')).to.be.false;
  });

  it('should return false for a string', function () {
    expect(isA('', 'fn')).to.be.false;
  });

  it('should return false for a number', function () {
    expect(isA(1, 'fn')).to.be.false;
  });

  it('should return false for null', function () {
    expect(isA(null, 'fn')).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isA(undefined, 'fn')).to.be.false;
  });

  it('should return false for an array', function () {
    expect(isA([], 'fn')).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isA(() => {}, 'fn')).to.be.false;
  });

  it('should return false for a symbol', function () {
    expect(isA(Symbol(), 'fn')).to.be.false;
  });
});
