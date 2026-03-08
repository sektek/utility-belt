import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { NonePredicate, noneOf } from './none-predicate.js';

use(chaiAsPromised);

describe('NonePredicate', function () {
  it('should create an instance and test none predicates', function () {
    const isPositive = (num: number) => num > 0;
    const isEven = (num: number) => num % 2 === 0;
    const nonePredicate = new NonePredicate({
      predicates: [isPositive, isEven],
    });

    expect(nonePredicate.test(-3)).to.eventually.be.true;
    expect(nonePredicate.test(-2)).to.eventually.be.false;
    expect(nonePredicate.test(3)).to.eventually.be.false;
    expect(nonePredicate.test(4)).to.eventually.be.false;
  });

  it('should handle async predicate functions', function () {
    const isPositiveAsync = async (num: number) => num > 0;
    const isEvenAsync = async (num: number) => num % 2 === 0;
    const nonePredicate = new NonePredicate({
      predicates: [isPositiveAsync, isEvenAsync],
    });

    expect(nonePredicate.test(-3)).to.eventually.be.true;
    expect(nonePredicate.test(-2)).to.eventually.be.false;
    expect(nonePredicate.test(3)).to.eventually.be.false;
    expect(nonePredicate.test(4)).to.eventually.be.false;
  });

  it('should handle no predicates', function () {
    const nonePredicate = new NonePredicate({ predicates: [] });

    expect(nonePredicate.test()).to.eventually.be.true;
  });

  describe('static wrap method', function () {
    it('should wrap a predicate component', function () {
      const isNonZero = { test: (num: number) => num !== 0 };
      const isLessThanTen = { test: (num: number) => num < 10 };
      const nonePredicate = NonePredicate.wrap(isNonZero, isLessThanTen);

      expect(nonePredicate.test(0)).to.eventually.be.true;
      expect(nonePredicate.test(5)).to.eventually.be.false;
      expect(nonePredicate.test(10)).to.eventually.be.false;
    });
  });

  describe('noneOf helper function', function () {
    it('should create a NonePredicate using noneOf', function () {
      const isNonZero = { test: (num: number) => num !== 0 };
      const isLessThanTen = { test: (num: number) => num < 10 };
      const nonePredicate = noneOf(isNonZero, isLessThanTen);

      expect(nonePredicate.test(0)).to.eventually.be.true;
      expect(nonePredicate.test(5)).to.eventually.be.false;
      expect(nonePredicate.test(10)).to.eventually.be.false;
    });
  });
});
