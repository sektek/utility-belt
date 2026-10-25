import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { ProcessingIterableProvider } from './processing-iterable-provider.js';

use(chaiAsPromised);

async function collect<R>(iterable: AsyncIterable<R>): Promise<R[]> {
  const result: R[] = [];

  for await (const value of iterable) {
    result.push(value);
  }

  return result;
}

describe('ProcessingIterableProvider', function () {
  it('should process values of a sync iterable', async function () {
    const provider = new ProcessingIterableProvider<number>({
      provider: () => [1, 2, 3],
      processor: (input: number) => input * 2,
    });

    expect(await collect(provider.values())).to.deep.equal([2, 4, 6]);
  });

  it('should process values of an async iterable', async function () {
    const provider = new ProcessingIterableProvider<number>({
      provider: async function* () {
        yield 1;
        yield 2;
      },
      processor: (input: number) => input + 10,
    });

    expect(await collect(provider.values())).to.deep.equal([11, 12]);
  });

  it('should process values of a promised iterable', async function () {
    const provider = new ProcessingIterableProvider<number>({
      provider: async () => new Set([4, 5]),
      processor: (input: number) => input * 3,
    });

    expect(await collect(provider.values())).to.deep.equal([12, 15]);
  });

  it('should handle an async processor', async function () {
    const provider = new ProcessingIterableProvider<number, string>({
      provider: () => [1, 2],
      processor: async (input: number) => `v${input}`,
    });

    expect(await collect(provider.values())).to.deep.equal(['v1', 'v2']);
  });

  it('should pass context to the wrapped provider', async function () {
    const provider = new ProcessingIterableProvider<
      number,
      number,
      { count: number }
    >({
      provider: context => Array.from({ length: context.count }, (_, i) => i),
      processor: (input: number) => input + 1,
    });

    expect(await collect(provider.values({ count: 3 }))).to.deep.equal([
      1, 2, 3,
    ]);
  });

  it('should preserve the order of the values', async function () {
    const delays = [30, 1, 10];
    const provider = new ProcessingIterableProvider<number>({
      provider: () => [0, 1, 2],
      processor: (input: number) =>
        new Promise<number>(resolve =>
          setTimeout(() => resolve(input), delays[input]),
        ),
    });

    expect(await collect(provider.values())).to.deep.equal([0, 1, 2]);
  });

  it('should not process anything until values are pulled', async function () {
    const processed: number[] = [];
    let providerCalls = 0;
    const provider = new ProcessingIterableProvider<number>({
      provider: () => {
        providerCalls++;
        return [1, 2, 3];
      },
      processor: (input: number) => {
        processed.push(input);
        return input;
      },
    });

    const iterator = provider.values()[Symbol.asyncIterator]();
    expect(processed).to.deep.equal([]);
    expect(providerCalls).to.equal(0);

    await iterator.next();
    expect(processed).to.deep.equal([1]);

    await iterator.next();
    expect(processed).to.deep.equal([1, 2]);
  });

  it('should stop processing when the consumer stops early', async function () {
    const processed: number[] = [];
    const provider = new ProcessingIterableProvider<number>({
      provider: () => [1, 2, 3, 4],
      processor: (input: number) => {
        processed.push(input);
        return input;
      },
    });

    for await (const value of provider.values()) {
      if (value === 2) {
        break;
      }
    }

    expect(processed).to.deep.equal([1, 2]);
  });

  it('should propagate errors from the wrapped provider', async function () {
    const provider = new ProcessingIterableProvider<number>({
      provider: () => {
        throw new Error('provider failed');
      },
      processor: (input: number) => input,
    });

    await expect(collect(provider.values())).to.be.rejectedWith(
      'provider failed',
    );
  });

  it('should propagate errors from the iterable', async function () {
    const provider = new ProcessingIterableProvider<number>({
      provider: async function* () {
        yield 1;
        throw new Error('iteration failed');
      },
      processor: (input: number) => input,
    });

    await expect(collect(provider.values())).to.be.rejectedWith(
      'iteration failed',
    );
  });

  it('should propagate processor errors and stop iteration', async function () {
    const processed: number[] = [];
    const provider = new ProcessingIterableProvider<number>({
      provider: () => [1, 2, 3],
      processor: (input: number) => {
        processed.push(input);

        if (input === 2) {
          throw new Error('processor failed');
        }

        return input;
      },
    });

    await expect(collect(provider.values())).to.be.rejectedWith(
      'processor failed',
    );
    expect(processed).to.deep.equal([1, 2]);
  });

  it('should yield nothing for an empty iterable', async function () {
    const processed: number[] = [];
    const provider = new ProcessingIterableProvider<number>({
      provider: () => [],
      processor: (input: number) => {
        processed.push(input);
        return input;
      },
    });

    expect(await collect(provider.values())).to.deep.equal([]);
    expect(processed).to.deep.equal([]);
  });

  it('should accept object forms of the provider and processor', async function () {
    const provider = new ProcessingIterableProvider<number, string>({
      provider: { values: () => [1, 2] },
      processor: { process: (input: number) => `n${input}` },
    });

    expect(await collect(provider.values())).to.deep.equal(['n1', 'n2']);
  });

  it('should accept an array as the provider', async function () {
    const provider = new ProcessingIterableProvider<number, string>({
      provider: [1, 2, 3],
      processor: (input: number) => `n${input}`,
    });

    expect(await collect(provider.values())).to.deep.equal(['n1', 'n2', 'n3']);
  });

  it('should accept a set as the provider', async function () {
    const provider = new ProcessingIterableProvider<number, string>({
      provider: new Set([1, 2, 3]),
      processor: (input: number) => `n${input}`,
    });

    expect(await collect(provider.values())).to.deep.equal(['n1', 'n2', 'n3']);
  });
});
