import { expect } from 'chai';

import { NegatedPredicate, negate } from './negate-predicate.js';

describe('NegatedPredicate', function () {
  describe('negate function', function () {
    it('should negate a predicate function', function () {
      const isEven = (num: number) => num % 2 === 0;
      const negatedIsEven = negate(isEven);
      expect(negatedIsEven(2)).to.be.false;
      expect(negatedIsEven(3)).to.be.true;
    });

    it('should negate a predicate component', function () {
      const isPositive = { test: (num: number) => num > 0 };
      const negatedIsPositive = negate(isPositive);
      expect(negatedIsPositive(-1)).to.be.true;
      expect(negatedIsPositive(1)).to.be.false;
    });
  });

  describe('NegatedPredicate class', function () {
    it('should create an instance and negate the predicate result', function () {
      const isNegative = new NegatedPredicate({
        predicate: (num: number) => num < 0,
      });
      expect(isNegative.test(-1)).to.be.false;
      expect(isNegative.test(1)).to.be.true;
    });

    it('should wrap a predicate component', function () {
      const isZero = { test: (num: number) => num === 0 };
      const negatedIsZero = NegatedPredicate.wrap(isZero);
      expect(negatedIsZero.test(0)).to.be.false;
      expect(negatedIsZero.test(1)).to.be.true;
    });
  });
});
