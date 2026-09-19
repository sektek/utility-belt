import { expect } from 'chai';

import { DelegatingPredicate } from './delegating-predicate.js';

describe('DelegatingPredicate', function () {
  it('should delegate to the predicate matching the selected key', async function () {
    const predicate = new DelegatingPredicate<number>({
      selector: (value: number) => (value % 2 === 0 ? 'even' : 'odd'),
      delegates: {
        even: () => true,
        odd: () => false,
      },
    });

    expect(await predicate.test(2)).to.be.true;
    expect(await predicate.test(3)).to.be.false;
  });

  it('should fall back to the default delegate when the key is not found', async function () {
    const predicate = new DelegatingPredicate<string>({
      selector: () => 'unknown',
      delegates: {
        known: () => true,
      },
      default: () => true,
    });

    expect(await predicate.test('anything')).to.be.true;
  });

  it('should reject by default when the key is not found and no default is given', async function () {
    const predicate = new DelegatingPredicate<string>({
      selector: () => 'unknown',
      delegates: {
        known: () => true,
      },
    });

    expect(await predicate.test('anything')).to.be.false;
  });

  it('should fall back to the default delegate when the selector returns undefined', async function () {
    const predicate = new DelegatingPredicate<string>({
      selector: () => undefined,
      delegates: {
        known: () => true,
      },
      default: () => true,
    });

    expect(await predicate.test('anything')).to.be.true;
  });

  it('should reject by default when the selector returns undefined and no default is given', async function () {
    const predicate = new DelegatingPredicate<string>({
      selector: () => undefined,
      delegates: {
        known: () => true,
      },
    });

    expect(await predicate.test('anything')).to.be.false;
  });

  it('should support component style selectors and delegates', async function () {
    const predicate = new DelegatingPredicate<string>({
      selector: { get: () => 'known' },
      delegates: {
        known: { test: () => true },
      },
      default: { test: () => false },
    });

    expect(await predicate.test('anything')).to.be.true;
  });

  it('should support an asynchronous selector', async function () {
    const predicate = new DelegatingPredicate<string>({
      selector: async () => 'known',
      delegates: {
        known: () => true,
      },
    });

    expect(await predicate.test('anything')).to.be.true;
  });
});
