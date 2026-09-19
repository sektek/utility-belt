import { expect } from 'chai';

import { isStoppable } from './is-stoppable.js';

describe('isStoppable', function () {
  it('should return true for an object with a stop function', function () {
    expect(isStoppable({ stop: () => {} })).to.be.true;
  });

  it('should return false for an object without a stop function', function () {
    expect(isStoppable({})).to.be.false;
  });

  it('should return false for an object with a non-function stop property', function () {
    expect(isStoppable({ stop: 'stop' })).to.be.false;
  });

  it('should return false for a string', function () {
    expect(isStoppable('')).to.be.false;
  });

  it('should return false for a number', function () {
    expect(isStoppable(1)).to.be.false;
  });

  it('should return false for null', function () {
    expect(isStoppable(null)).to.be.false;
  });

  it('should return false for undefined', function () {
    expect(isStoppable(undefined)).to.be.false;
  });

  it('should return false for an array', function () {
    expect(isStoppable([])).to.be.false;
  });

  it('should return false for a function', function () {
    expect(isStoppable(() => {})).to.be.false;
  });

  it('should return false for a symbol', function () {
    expect(isStoppable(Symbol())).to.be.false;
  });
});
