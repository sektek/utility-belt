import { expect } from 'chai';

import { isObject } from './is-object.js';

describe('isObject', function () {
  it('returns true for a plain object', function () {
    expect(isObject({})).to.be.true;
  });

  it('returns true for an array', function () {
    expect(isObject([])).to.be.true;
  });

  it('returns true for a function', function () {
    expect(isObject(() => {})).to.be.true;
  });

  it('returns true for a Date', function () {
    expect(isObject(new Date())).to.be.true;
  });

  it('returns false for null', function () {
    expect(isObject(null)).to.be.false;
  });

  it('returns false for undefined', function () {
    expect(isObject(undefined)).to.be.false;
  });

  it('returns false for a string', function () {
    expect(isObject('value')).to.be.false;
  });

  it('returns false for a number', function () {
    expect(isObject(1)).to.be.false;
  });

  it('returns false for a bigint', function () {
    expect(isObject(1n)).to.be.false;
  });

  it('returns false for a boolean', function () {
    expect(isObject(true)).to.be.false;
  });

  it('returns false for a symbol', function () {
    expect(isObject(Symbol())).to.be.false;
  });
});
