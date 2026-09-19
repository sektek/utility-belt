import { expect } from 'chai';

import { isStartable } from './is-startable.js';

describe('isStartable', function () {
  it('should return true for an object with a start function', function () {
    expect(isStartable({ start: () => {} })).to.be.true;
  });

  it('should return false for an object without a start function', function () {
    expect(isStartable({})).to.be.false;
  });

  it('should return false for an object with a non-function start property', function () {
    expect(isStartable({ start: 'start' })).to.be.false;
  });

  it('should return false for a string', function () {
    expect(isStartable('')).to.be.false;
  });

  it('should return false for a number', function () {
    expect(isStartable(1)).to.be.false;
  });

  it('should return false for null', function () {
    expect(isStartable(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isStartable(undefined)).to.be.false;
  });

  it('should return false for an array', function () {
    expect(isStartable([])).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isStartable(() => {})).to.be.false;
  });

  it('should return false for a symbol', function () {
    expect(isStartable(Symbol())).to.be.false;
  });
});
