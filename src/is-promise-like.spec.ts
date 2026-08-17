import { expect } from 'chai';

import { isPromiseLike } from './is-promise-like.js';

describe('isPromiseLike', function () {
  it('returns true for a Promise', function () {
    expect(isPromiseLike(Promise.resolve())).to.be.true;
  });

  it('returns true for an object with a then function', function () {
    expect(isPromiseLike({ then: () => {} })).to.be.true;
  });

  it('returns true for a function with a then function', function () {
    expect(isPromiseLike(Object.assign(() => {}, { then: () => {} }))).to.be
      .true;
  });

  it('returns false for null', function () {
    expect(isPromiseLike(null)).to.be.false;
  });

  it('returns false for a primitive', function () {
    expect(isPromiseLike('value')).to.be.false;
  });

  it('returns false for an object without then', function () {
    expect(isPromiseLike({})).to.be.false;
  });

  it('returns false for an object with a non-function then member', function () {
    expect(isPromiseLike({ then: true })).to.be.false;
  });
});
