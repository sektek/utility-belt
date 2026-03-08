import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { AllPredicate, allOf } from './all-predicate.js';

use(chaiAsPromised);

describe('AllPredicate', function () {
  it('should create an instance and test all predicates', function () {
    const isPositive = (num: number) => num > 0;
    const isEven = (num: number) => num % 2 === 0;
    const allPredicate = new AllPredicate({
      predicates: [isPositive, isEven],
    });

    expect(allPredicate.test(4)).to.eventually.be.true;
    expect(allPredicate.test(3)).to.eventually.be.false;
    expect(allPredicate.test(-2)).to.eventually.be.false;
  });

  it('should handle async predicate functions', function () {
    const isPositiveAsync = async (num: number) => num > 0;
    const isEvenAsync = async (num: number) => num % 2 === 0;
    const allPredicate = new AllPredicate({
      predicates: [isPositiveAsync, isEvenAsync],
    });

    expect(allPredicate.test(4)).to.eventually.be.true;
    expect(allPredicate.test(3)).to.eventually.be.false;
    expect(allPredicate.test(-2)).to.eventually.be.false;
  });

  it('should handle no predicates', function () {
    const allPredicate = new AllPredicate({ predicates: [] });

    expect(allPredicate.test()).to.eventually.be.false;
  });

  describe('static wrap method', function () {
    it('should wrap a predicate component', function () {
      const isNonZero = { test: (num: number) => num !== 0 };
      const isLessThanTen = { test: (num: number) => num < 10 };
      const allPredicate = AllPredicate.wrap(isNonZero, isLessThanTen);

      expect(allPredicate.test(5)).to.eventually.be.true;
      expect(allPredicate.test(0)).to.eventually.be.false;
      expect(allPredicate.test(10)).to.eventually.be.false;
    });
  });

  describe('allOf helper function', function () {
    it('should create an AllPredicate using allOf', function () {
      const isNonZero = { test: (num: number) => num !== 0 };
      const isLessThanTen = { test: (num: number) => num < 10 };
      const allPredicate = allOf(isNonZero, isLessThanTen);

      expect(allPredicate.test(5)).to.eventually.be.true;
      expect(allPredicate.test(0)).to.eventually.be.false;
      expect(allPredicate.test(10)).to.eventually.be.false;
    });
  });
});
