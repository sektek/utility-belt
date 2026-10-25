import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import {
  FilteringIterableProvider,
  FilteringIterableProviderOptions,
} from './filtering-iterable-provider.js';

use(chaiAsPromised);

async function collect<R>(iterable: AsyncIterable<R>): Promise<R[]> {
  const result: R[] = [];

  for await (const value of iterable) {
    result.push(value);
  }

  return result;
}

const isEven = (value: number) => value % 2 === 0;

describe('FilteringIterableProvider', function () {
  describe('with a predicate', function () {
    it('should only provide passing values of a sync iterable', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: () => [1, 2, 3, 4],
        predicate: isEven,
      });

      expect(await collect(provider.values())).to.deep.equal([2, 4]);
    });

    it('should only provide passing values of an async iterable', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: async function* () {
          yield 1;
          yield 2;
          yield 4;
        },
        predicate: isEven,
      });

      expect(await collect(provider.values())).to.deep.equal([2, 4]);
    });

    it('should only provide passing values of a promised iterable', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: async () => new Set([5, 6, 8]),
        predicate: isEven,
      });

      expect(await collect(provider.values())).to.deep.equal([6, 8]);
    });

    it('should handle an async predicate', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: () => [1, 2, 3, 4],
        predicate: async (value: number) => value > 2,
      });

      expect(await collect(provider.values())).to.deep.equal([3, 4]);
    });

    it('should accept a predicate object', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: { values: () => [1, 2, 3, 4] },
        predicate: { test: isEven },
      });

      expect(await collect(provider.values())).to.deep.equal([2, 4]);
    });

    it('should pass context to the wrapped provider', async function () {
      const provider = new FilteringIterableProvider<number, { count: number }>(
        {
          provider: context =>
            Array.from({ length: context.count }, (_, i) => i),
          predicate: isEven,
        },
      );

      expect(await collect(provider.values({ count: 5 }))).to.deep.equal([
        0, 2, 4,
      ]);
    });

    it('should preserve the order of the values', async function () {
      const delays = [30, 1, 10];
      const provider = new FilteringIterableProvider<number>({
        provider: () => [0, 1, 2],
        predicate: (value: number) =>
          new Promise<boolean>(resolve =>
            setTimeout(() => resolve(true), delays[value]),
          ),
      });

      expect(await collect(provider.values())).to.deep.equal([0, 1, 2]);
    });

    it('should provide nothing when no value passes', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: () => [1, 3, 5],
        predicate: isEven,
      });

      expect(await collect(provider.values())).to.deep.equal([]);
    });

    it('should provide nothing for an empty source', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: () => [],
        predicate: isEven,
      });

      expect(await collect(provider.values())).to.deep.equal([]);
    });

    it('should provide everything when all values pass', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: () => [1, 2, 3],
        predicate: () => true,
      });

      expect(await collect(provider.values())).to.deep.equal([1, 2, 3]);
    });

    it('should be lazy', async function () {
      const tested: number[] = [];
      const provider = new FilteringIterableProvider<number>({
        provider: () => [1, 2, 3, 4],
        predicate: (value: number) => {
          tested.push(value);
          return isEven(value);
        },
      });

      const iterator = provider.values()[Symbol.asyncIterator]();
      expect(tested).to.deep.equal([]);

      const first = await iterator.next();
      expect(first.value).to.equal(2);
      expect(tested).to.deep.equal([1, 2]);

      await iterator.return?.();
      expect(tested).to.deep.equal([1, 2]);
    });

    it('should stop testing when the consumer stops early', async function () {
      const tested: number[] = [];
      const provider = new FilteringIterableProvider<number>({
        provider: () => [2, 4, 6, 8],
        predicate: (value: number) => {
          tested.push(value);
          return true;
        },
      });

      for await (const value of provider.values()) {
        if (value === 4) {
          break;
        }
      }

      expect(tested).to.deep.equal([2, 4]);
    });

    it('should propagate provider errors', async function () {
      const provider = new FilteringIterableProvider<number>({
        provider: () => {
          throw new Error('provider failed');
        },
        predicate: isEven,
      });

      await expect(collect(provider.values())).to.be.rejectedWith(
        'provider failed',
      );
    });

    it('should propagate predicate errors and stop', async function () {
      const tested: number[] = [];
      const provider = new FilteringIterableProvider<number>({
        provider: () => [1, 2, 3],
        predicate: (value: number) => {
          tested.push(value);
          if (value === 2) {
            throw new Error('predicate failed');
          }

          return true;
        },
      });

      await expect(collect(provider.values())).to.be.rejectedWith(
        'predicate failed',
      );
      expect(tested).to.deep.equal([1, 2]);
    });
  });

  describe('with a predicate provider', function () {
    type Context = { min: number };

    const minProvider = (context: Context) => (value: number) =>
      value >= context.min;

    it('should apply the predicate for the context', async function () {
      const provider = new FilteringIterableProvider<number, Context>({
        provider: () => [1, 2, 3, 4],
        predicateProvider: minProvider,
      });

      expect(await collect(provider.values({ min: 3 }))).to.deep.equal([3, 4]);
      expect(await collect(provider.values({ min: 2 }))).to.deep.equal([
        2, 3, 4,
      ]);
    });

    it('should pass the context to the predicate provider', async function () {
      const contexts: Context[] = [];
      const provider = new FilteringIterableProvider<number, Context>({
        provider: () => [1, 2],
        predicateProvider: (context: Context) => {
          contexts.push(context);
          return () => true;
        },
      });
      const context = { min: 1 };

      await collect(provider.values(context));

      expect(contexts).to.deep.equal([context]);
      expect(contexts[0]).to.equal(context);
    });

    it('should pass the context to the wrapped provider', async function () {
      const contexts: Context[] = [];
      const provider = new FilteringIterableProvider<number, Context>({
        provider: context => {
          contexts.push(context);
          return [1];
        },
        predicateProvider: minProvider,
      });
      const context = { min: 0 };

      await collect(provider.values(context));

      expect(contexts[0]).to.equal(context);
    });

    it('should handle an async predicate provider', async function () {
      const provider = new FilteringIterableProvider<number, Context>({
        provider: () => [1, 2, 3, 4],
        predicateProvider: async (context: Context) => ({
          test: async (value: number) => value >= context.min,
        }),
      });

      expect(await collect(provider.values({ min: 3 }))).to.deep.equal([3, 4]);
    });

    it('should accept a predicate provider object', async function () {
      const provider = new FilteringIterableProvider<number, Context>({
        provider: () => [1, 2, 3, 4],
        predicateProvider: { get: minProvider },
      });

      expect(await collect(provider.values({ min: 4 }))).to.deep.equal([4]);
    });

    it('should call the predicate provider once per values call', async function () {
      let calls = 0;
      const provider = new FilteringIterableProvider<number, Context>({
        provider: () => [1, 2, 3, 4],
        predicateProvider: (context: Context) => {
          calls++;
          return minProvider(context);
        },
      });

      await collect(provider.values({ min: 1 }));
      expect(calls).to.equal(1);

      await collect(provider.values({ min: 1 }));
      expect(calls).to.equal(2);
    });

    it('should propagate predicate provider errors', async function () {
      const provider = new FilteringIterableProvider<number, Context>({
        provider: () => [1],
        predicateProvider: () => {
          throw new Error('predicate provider failed');
        },
      });

      await expect(collect(provider.values({ min: 0 }))).to.be.rejectedWith(
        'predicate provider failed',
      );
    });

    it('should propagate errors of the provided predicate', async function () {
      const provider = new FilteringIterableProvider<number, Context>({
        provider: () => [1],
        predicateProvider: () => () => {
          throw new Error('predicate failed');
        },
      });

      await expect(collect(provider.values({ min: 0 }))).to.be.rejectedWith(
        'predicate failed',
      );
    });
  });

  describe('constructor', function () {
    it('should throw when neither predicate nor predicateProvider is given', function () {
      const opts = {
        provider: () => [1],
      } as unknown as FilteringIterableProviderOptions<number>;

      expect(() => new FilteringIterableProvider<number>(opts)).to.throw(
        'predicate',
      );
    });
  });
});
