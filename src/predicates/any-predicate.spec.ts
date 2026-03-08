import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { AnyPredicate, anyOf } from './any-predicate.js';

use(chaiAsPromised);

describe('AnyPredicate', function () {
  it('should create an instance and test any predicates', function () {
    const isPositive = (num: number) => num > 0;
    const isEven = (num: number) => num % 2 === 0;
    const anyPredicate = new AnyPredicate({
      predicates: [isPositive, isEven],
    });

    expect(anyPredicate.test(4)).to.eventually.be.true;
    expect(anyPredicate.test(3)).to.eventually.be.true;
    expect(anyPredicate.test(-2)).to.eventually.be.true;
    expect(anyPredicate.test(-3)).to.eventually.be.false;
  });

  it('should handle async predicate functions', function () {
    const isPositiveAsync = async (num: number) => num > 0;
    const isEvenAsync = async (num: number) => num % 2 === 0;
    const anyPredicate = new AnyPredicate({
      predicates: [isPositiveAsync, isEvenAsync],
    });

    expect(anyPredicate.test(4)).to.eventually.be.true;
    expect(anyPredicate.test(3)).to.eventually.be.true;
    expect(anyPredicate.test(-2)).to.eventually.be.true;
    expect(anyPredicate.test(-3)).to.eventually.be.false;
  });

  it('should handle no predicates', function () {
    const anyPredicate = new AnyPredicate({ predicates: [] });

    expect(anyPredicate.test()).to.eventually.be.false;
  });

  describe('static wrap method', function () {
    it('should wrap a predicate component', function () {
      const isNonZero = { test: (num: number) => num !== 0 };
      const isLessThanTen = { test: (num: number) => num < 10 };
      const anyPredicate = AnyPredicate.wrap(isNonZero, isLessThanTen);

      expect(anyPredicate.test(5)).to.eventually.be.true;
      expect(anyPredicate.test(0)).to.eventually.be.true;
      expect(anyPredicate.test(10)).to.eventually.be.false;
    });
  });

  describe('anyOf helper function', function () {
    it('should create an AnyPredicate using anyOf', function () {
      const isNonZero = { test: (num: number) => num !== 0 };
      const isLessThanTen = { test: (num: number) => num < 10 };
      const anyPredicate = anyOf(isNonZero, isLessThanTen);

      expect(anyPredicate.test(5)).to.eventually.be.true;
      expect(anyPredicate.test(0)).to.eventually.be.true;
      expect(anyPredicate.test(10)).to.eventually.be.false;
    });
  });
});
