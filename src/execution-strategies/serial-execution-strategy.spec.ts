import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { fake } from 'sinon';
import sinonChai from 'sinon-chai';

import { serialExecutionStrategy } from './serial-execution-strategy.js';

use(chaiAsPromised);
use(sinonChai);

describe('SerialStrategy', function () {
  it('should execute all handlers in serial', async function () {
    const obj = { value: 1 };
    let value = 0;
    const handler1 = async (obj: { value: number }) => {
      value = obj.value;
    };
    const handler2 = async () => {
      expect(value).to.equal(1);
      value = 2;
    };
    const handler3 = async () => {
      expect(value).to.equal(2);
      value = 3;
    };

    await serialExecutionStrategy([handler1, handler2, handler3], obj);
  });

  it('should stop execution if a handler fails', async function () {
    const error = new Error('Handler failed');
    const obj = { value: 1 };
    const handler1 = fake.returns(Promise.resolve());
    const handler2 = fake.returns(Promise.reject(error));
    const handler3 = fake.returns(Promise.resolve());

    await expect(
      serialExecutionStrategy([handler1, handler2, handler3], obj),
    ).to.be.eventually.rejectedWith(error);
    expect(handler1).to.have.been.calledOnceWith(obj);
    expect(handler2).to.have.been.calledOnce;
    expect(handler3).not.to.have.been.called;
  });
});
