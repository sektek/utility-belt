import { expect } from 'chai';

import { NegatedPredicate, negate } from './negate-predicate.js';

describe('NegatedPredicate', function () {
  it('should create an instance and negate the predicate result', async function () {
    const isNegative = new NegatedPredicate({
      predicate: (num: number) => num < 0,
    });
    expect(await isNegative.test(-1)).to.be.false;
    expect(await isNegative.test(1)).to.be.true;
  });

  describe('static wrap method', function () {
    it('should wrap a predicate component', async function () {
      const isZero = { test: (num: number) => num === 0 };
      const negatedIsZero = NegatedPredicate.wrap(isZero);
      expect(await negatedIsZero.test(0)).to.be.false;
      expect(await negatedIsZero.test(1)).to.be.true;
    });
  });

  describe('negate helper function', function () {
    it('should create a NegatedPredicate using negate', async function () {
      const isZero = { test: (num: number) => num === 0 };
      const negatedIsZero = negate(isZero);
      expect(await negatedIsZero.test(0)).to.be.false;
      expect(await negatedIsZero.test(1)).to.be.true;
    });
  });
});
