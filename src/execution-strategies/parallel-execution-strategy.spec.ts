import { expect, use } from 'chai';
import { fake, spy } from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import sinonChai from 'sinon-chai';

use(chaiAsPromised);
use(sinonChai);

import { ExecutionError } from './execution-error.js';
import { ParallelExecutionStrategy } from './parallel-execution-strategy.js';

describe('ParallelStrategy', function () {
  let parallelExecutionStrategy: ParallelExecutionStrategy<
    (...args: unknown[]) => Promise<void>
  >;

  beforeEach(function () {
    parallelExecutionStrategy = new ParallelExecutionStrategy();
  });

  it('should execute all handlers in parallel', async function () {
    const obj = { foo: 'bar' };
    const handler1 = fake();
    const handler2 = fake();

    await parallelExecutionStrategy.execute([handler1, handler2], obj);

    expect(handler1).to.have.been.calledOnceWith(obj);
    expect(handler2).to.have.been.calledOnceWith(obj);
  });

  it('should throw an error if any handler fails', async function () {
    const error = new Error('Handler failed');
    const obj = { foo: 'bar' };
    const handler1 = fake.returns(Promise.resolve());
    const handler2 = fake.returns(Promise.reject(error));

    await expect(
      parallelExecutionStrategy.execute([handler1, handler2], obj),
    ).to.be.eventually.rejectedWith(error);
    expect(handler1).to.have.been.calledOnceWith(obj);
  });

  it('should throw an ExecutionError if multiple handlers fail', async function () {
    const error1 = new Error('Handler 1 failed');
    const error2 = new Error('Handler 2 failed');
    const obj = { foo: 'bar' };
    const handler1 = fake.returns(Promise.reject(error1));
    const handler2 = fake.returns(Promise.reject(error2));

    const err = await expect(
      parallelExecutionStrategy.execute([handler1, handler2], obj),
    ).to.be.eventually.rejectedWith(
      'One or more errors occurred during execution.',
    );
    expect(err.errors).to.have.length(2);
    expect(err).to.be.instanceOf(ExecutionError);
    expect(err.errors).to.include(error1);
    expect(err.errors).to.include(error2);
  });

  it('should handle async iterable of functions', async function () {
    const obj = { foo: 'bar' };
    const handler1 = fake();
    const handler2 = fake();

    async function* generateHandlers() {
      yield handler1;
      yield handler2;
    }

    await parallelExecutionStrategy.execute(generateHandlers(), obj);

    expect(handler1).to.have.been.calledOnceWith(obj);
    expect(handler2).to.have.been.calledOnceWith(obj);
  });

  it('should respect max concurrency', async function () {
    const obj = { foo: 'bar' };
    const handler1 = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 50));
    };
    const handler2 = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 50));
    };
    const handler3 = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 50));
    };
    const handler1Spy = spy(handler1);
    const handler2Spy = spy(handler2);
    const handler3Spy = spy(handler3);

    parallelExecutionStrategy = new ParallelExecutionStrategy({
      maxConcurrency: 2,
    });

    const startTime = Date.now();
    await parallelExecutionStrategy.execute(
      [handler1Spy, handler2Spy, handler3Spy],
      obj,
    );
    const endTime = Date.now();

    expect(handler1Spy).to.have.been.calledOnceWith(obj);
    expect(handler2Spy).to.have.been.calledOnceWith(obj);
    expect(handler3Spy).to.have.been.calledOnceWith(obj);

    // Since max concurrency is 2, total time should be at least 100ms
    expect(endTime - startTime).to.be.gte(100);
  });

  it('should capture errors from all handlers when using max concurrency', async function () {
    const error1 = new Error('Handler 1 failed');
    const error2 = new Error('Handler 2 failed');
    const obj = { foo: 'bar' };
    const handler1 = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 50));
      throw error1;
    };
    const handler2 = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 50));
    };
    const handler3 = async () => {
      await new Promise<void>(resolve => setTimeout(resolve, 50));
      throw error2;
    };

    parallelExecutionStrategy = new ParallelExecutionStrategy({
      maxConcurrency: 2,
    });

    const err = await expect(
      parallelExecutionStrategy.execute([handler1, handler2, handler3], obj),
    ).to.be.eventually.rejectedWith(
      'One or more errors occurred during execution.',
    );
    expect(err).to.be.instanceOf(ExecutionError);
    expect(err.errors).to.have.length(2);
    expect(err.errors).to.include(error1);
    expect(err.errors).to.include(error2);
  });
});
