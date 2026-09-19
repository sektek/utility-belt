import { expect } from 'chai';

import { AcceptPredicate, accept } from './accept-predicate.js';

describe('AcceptPredicate', function () {
  it('should return true from an instance', function () {
    const predicate = new AcceptPredicate();
    expect(predicate.test()).to.be.true;
  });

  describe('static test method', function () {
    it('should return true', function () {
      expect(AcceptPredicate.test()).to.be.true;
    });
  });

  describe('accept helper function', function () {
    it('should return true', function () {
      expect(accept()).to.be.true;
    });
  });
});
