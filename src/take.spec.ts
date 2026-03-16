import { expect } from 'chai';

import { take } from './take.js';

describe('take', function () {
  it('should take the specified number of items from an iterable', async function () {
    const iterable = [1, 2, 3, 4, 5];
    const result = [];
    for await (const item of take(iterable, 3)) {
      result.push(item);
    }
    expect(result).to.deep.equal([1, 2, 3]);
  });

  it('should return all items if count is greater than iterable length', async function () {
    const iterable = [1, 2];
    const result = [];
    for await (const item of take(iterable, 5)) {
      result.push(item);
    }
    expect(result).to.deep.equal([1, 2]);
  });

  it('should return an empty array if count is zero', async function () {
    const iterable = [1, 2, 3];
    const result = [];
    for await (const item of take(iterable, 0)) {
      result.push(item);
    }
    expect(result).to.deep.equal([]);
  });

  it('should return an empty array if count is negative', async function () {
    const iterable = [1, 2, 3];
    const result = [];
    for await (const item of take(iterable, -1)) {
      result.push(item);
    }
    expect(result).to.deep.equal([]);
  });

  it('should skip the specified number of items before taking', async function () {
    const iterable = [1, 2, 3, 4, 5];
    const result = [];
    for await (const item of take(iterable, 2, 2)) {
      result.push(item);
    }
    expect(result).to.deep.equal([3, 4]);
  });

  it('should treat negative offset as zero', async function () {
    const iterable = [1, 2, 3];
    const result = [];
    for await (const item of take(iterable, 2, -1)) {
      result.push(item);
    }
    expect(result).to.deep.equal([1, 2]);
  });

  it('should function correctly with async iterables', async function () {
    const asyncIterable = {
      async *[Symbol.asyncIterator]() {
        yield 1;
        yield 2;
        yield 3;
      },
    };
    const result = [];
    for await (const item of take(asyncIterable, 2)) {
      result.push(item);
    }
    expect(result).to.deep.equal([1, 2]);
  });
});
