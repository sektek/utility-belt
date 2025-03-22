import { expect } from 'chai';
import { fake } from 'sinon';

import { RoundRobinStrategy } from './round-robin-strategy.js';

describe('RoundRobinStrategy', function () {
  it('should execute all handlers in round-robin', async function () {
    const obj = { foo: 'bar' };
    const handler1 = fake();
    const handler2 = fake();
    const handler3 = fake();
    const strategy = new RoundRobinStrategy();
    await strategy.execute([handler1, handler2, handler3], obj);

    expect(handler1.calledOnceWith(obj)).to.be.true;
    expect(handler2.calledOnceWith(obj)).to.be.false;
    expect(handler3.calledOnceWith(obj)).to.be.false;

    await strategy.execute([handler1, handler2, handler3], obj);
    expect(handler1.calledOnceWith(obj)).to.be.true;
    expect(handler2.calledOnceWith(obj)).to.be.true;
    expect(handler3.calledOnceWith(obj)).to.be.false;

    await strategy.execute([handler1, handler2, handler3], obj);
    expect(handler1.calledOnceWith(obj)).to.be.true;
    expect(handler2.calledOnceWith(obj)).to.be.true;
    expect(handler3.calledOnceWith(obj)).to.be.true;

    await strategy.execute([handler1, handler2, handler3], obj);
    expect(handler1.callCount).to.equal(2);
    expect(handler2.calledOnceWith(obj)).to.be.true;
    expect(handler3.calledOnceWith(obj)).to.be.true;
  });
});
