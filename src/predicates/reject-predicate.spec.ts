import { expect } from 'chai';

import { RejectPredicate, reject } from './reject-predicate.js';

describe('RejectPredicate', function () {
  it('should return false from an instance', function () {
    const predicate = new RejectPredicate();
    expect(predicate.test()).to.be.false;
  });

  describe('static test method', function () {
    it('should return false', function () {
      expect(RejectPredicate.test()).to.be.false;
    });
  });

  describe('reject helper function', function () {
    it('should return false', function () {
      expect(reject()).to.be.false;
    });
  });
});
