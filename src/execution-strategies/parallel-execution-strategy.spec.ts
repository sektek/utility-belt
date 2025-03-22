import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fake } from 'sinon';
import sinonChai from 'sinon-chai';

use(chaiAsPromised);
use(sinonChai);

import { parallelExecutionStrategy } from './parallel-execution-strategy.js';

describe('ParallelStrategy', function () {
  it('should execute all handlers in parallel', async function () {
    const obj = { foo: 'bar' };
    const handler1 = fake();
    const handler2 = fake();

    await parallelExecutionStrategy([handler1, handler2], obj);

    expect(handler1).to.have.been.calledOnceWith(obj);
    expect(handler2).to.have.been.calledOnceWith(obj);
  });

  it('should throw an error if any handler fails', async function () {
    const error = new Error('Handler failed');
    const obj = { foo: 'bar' };
    const handler1 = fake.returns(Promise.resolve());
    const handler2 = fake.returns(Promise.reject(error));

    await expect(
      parallelExecutionStrategy([handler1, handler2], obj),
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
      parallelExecutionStrategy([handler1, handler2], obj),
    ).to.be.eventually.rejectedWith(
      'Multiple errors occurred during execution.',
    );
    expect(err).to.have.property('causes');
    expect(err.causes).to.have.length(2);
    expect(err.causes).to.include(error1);
    expect(err.causes).to.include(error2);
  });
});
