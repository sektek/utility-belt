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

  it('should handle empty executables', async function () {
    const strategy = new RoundRobinStrategy();
    await strategy.execute([]);
  });

  it('should handle async iterable of functions', async function () {
    const obj = { foo: 'bar' };
    const handler1 = fake();
    const handler2 = fake();
    const handler3 = fake();
    async function* generateHandlers() {
      yield handler1;
      yield handler2;
      yield handler3;
    }
    const strategy = new RoundRobinStrategy();
    await strategy.execute(generateHandlers(), obj);

    expect(handler1.calledOnceWith(obj)).to.be.true;
    expect(handler2.calledOnceWith(obj)).to.be.false;
    expect(handler3.calledOnceWith(obj)).to.be.false;
  });

  it('should handle errors from async iterable handlers', async function () {
    const error = new Error('Handler failed');
    const handler1 = fake();
    const handler2 = fake.returns(Promise.reject(error));

    async function* generateHandlers() {
      yield handler1;
      yield handler2;
    }

    const strategy = new RoundRobinStrategy();
    await strategy.execute(generateHandlers(), {});

    await expect(
      strategy.execute(generateHandlers(), {}),
    ).to.be.eventually.rejectedWith(error);
  });
});
