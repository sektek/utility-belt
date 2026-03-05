import { expect } from 'chai';

import { NegatedPredicate } from './negate-predicate.js';

describe('NegatedPredicate', function () {
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
