import { expect } from 'chai';

import { ExecutionSet } from './execution-set.js';

describe('ExecutionSet', function () {
  let executionSet: ExecutionSet;

  beforeEach(function () {
    executionSet = new ExecutionSet();
  });

  it('should add and delete promises correctly', function () {
    const promise1 = Promise.resolve();
    const promise2 = Promise.resolve();

    executionSet.add(promise1);
    expect(executionSet.size).to.equal(1);

    executionSet.add(promise2);
    expect(executionSet.size).to.equal(2);

    executionSet.delete(promise1);
    expect(executionSet.size).to.equal(1);

    executionSet.delete(promise2);
    expect(executionSet.size).to.equal(0);
  });

  it('should handle adding a promise that was previously deleted', function () {
    const promise = Promise.resolve();

    executionSet.delete(promise);
    expect(executionSet.size).to.equal(0);

    executionSet.add(promise);
    expect(executionSet.size).to.equal(0);
  });

  it('should handle deleting a promise that was previously added', function () {
    const promise = Promise.resolve();

    executionSet.add(promise);
    expect(executionSet.size).to.equal(1);

    executionSet.delete(promise);
    expect(executionSet.size).to.equal(0);

    executionSet.delete(promise);
    expect(executionSet.size).to.equal(0);
  });

  it('should be iterable', function () {
    const promise1 = Promise.resolve(1);
    const promise2 = Promise.resolve(2);

    executionSet.add(promise1);
    executionSet.add(promise2);

    const promises = Array.from(executionSet);
    expect(promises).to.include.members([promise1, promise2]);
  });
});
