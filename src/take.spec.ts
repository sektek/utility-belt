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

  it('should return all items if limit is greater than iterable length', async function () {
    const iterable = [1, 2];
    const result = [];
    for await (const item of take(iterable, 5)) {
      result.push(item);
    }
    expect(result).to.deep.equal([1, 2]);
  });

  it('should return an empty array if limit is zero', async function () {
    const iterable = [1, 2, 3];
    const result = [];
    for await (const item of take(iterable, 0)) {
      result.push(item);
    }
    expect(result).to.deep.equal([]);
  });

  it('should return an empty array if limit is negative', async function () {
    const iterable = [1, 2, 3];
    const result = [];
    for await (const item of take(iterable, -1)) {
      result.push(item);
    }
    expect(result).to.deep.equal([]);
  });

  it('should throw an error if limit is not a safe integer', async function () {
    const iterable = [1, 2, 3];
    try {
      for await (const item of take(iterable, 1.5)) {
        // This block should not be executed
      }
      throw new Error('Expected error was not thrown');
    } catch (error) {
      expect(error).to.be.instanceOf(TypeError);
      expect(error.message).to.equal('Limit must be a safe integer');
    }
  });

  it('should throw an error if offset is not a finite safe integer', async function () {
    const iterable = [1, 2, 3];
    try {
      await take(iterable, 2, 1.5).next();
    } catch (error) {
      expect(error).to.be.instanceOf(TypeError);
      expect(error.message).to.equal('Offset must be a finite safe integer');
    }
  });

  it('should throw an error if offset is a non-finite number', async function () {
    const iterable = [1, 2, 3];
    try {
      await take(iterable, 2, Infinity).next();
    } catch (error) {
      expect(error).to.be.instanceOf(TypeError);
      expect(error.message).to.equal('Offset must be a finite safe integer');
    }
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
