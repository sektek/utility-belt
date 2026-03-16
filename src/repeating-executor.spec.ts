import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { IntervalScheduleProvider } from './interval-schedule-provider.js';

import { RepeatingExecutor } from './repeating-executor.js';

use(chaiAsPromised);
use(sinonChai);

describe('RepeatingExecutor', function () {
  let clock: sinon.SinonFakeTimers;

  beforeEach(function () {
    clock = sinon.useFakeTimers();
  });

  afterEach(function () {
    clock.restore();
  });

  it('should throw an error if neither task nor taskProvider is provided', function () {
    expect(
      () =>
        new RepeatingExecutor<void>({
          scheduleProvider: new IntervalScheduleProvider({ intervalMs: 1000 }),
        }),
    ).to.throw(
      'Either task or taskProvider must be provided to RepeatingExecutor',
    );
  });

  it('should execute the provided task function based on the specified schedule provider', async function () {
    const taskFn = sinon.fake.resolves(undefined);
    const executor = new RepeatingExecutor<void>({
      task: { execute: taskFn },
      scheduleProvider: new IntervalScheduleProvider({ intervalMs: 1000 }),
    });

    executor.start();

    await clock.tickAsync(1000);
    await clock.tickAsync(1000);
    await clock.tickAsync(1000);

    executor.stop();

    expect(taskFn.callCount).to.equal(3);
  });

  it('should use the context provided to the task function', async function () {
    const taskFn = sinon.fake.resolves(undefined);
    const context = { value: 42 };
    const executor = new RepeatingExecutor<{ value: number }>({
      task: { execute: taskFn },
      context: context,
      scheduleProvider: new IntervalScheduleProvider({ intervalMs: 1000 }),
    });

    executor.start();

    await clock.tickAsync(1000);
    await clock.tickAsync(1000);

    executor.stop();

    expect(taskFn.callCount).to.equal(2);
    expect(taskFn.alwaysCalledWithExactly(context)).to.be.true;
  });

  it('should use the context provided by the contextProvider', async function () {
    const taskFn = sinon.fake();
    let x = 0;
    const contextProvider = () => {
      x += 1;
      return { value: x };
    };
    const executor = new RepeatingExecutor<{ value: number }>({
      task: { execute: taskFn },
      contextProvider: contextProvider,
      scheduleProvider: new IntervalScheduleProvider({ intervalMs: 1000 }),
    });

    executor.start();

    await clock.tickAsync(1000);
    await clock.tickAsync(1000);

    executor.stop();

    expect(taskFn.callCount).to.equal(2);
    expect(taskFn.getCall(0).args[0].value).to.equal(1);
    expect(taskFn.getCall(1).args[0].value).to.equal(2);
  });

  it('should continue scheduling executions even if the task throws an error', async function () {
    const taskFn = sinon.stub();
    taskFn.onCall(0).rejects(new Error('Task failed'));
    taskFn.onCall(1).resolves(undefined);
    const executor = new RepeatingExecutor<void>({
      task: { execute: taskFn },
      scheduleProvider: new IntervalScheduleProvider({ intervalMs: 1000 }),
    });

    executor.start();

    await clock.tickAsync(1000);
    await clock.tickAsync(1000);

    executor.stop();

    expect(taskFn.callCount).to.equal(2);
  });

  it('should stop scheduling executions when stopped', async function () {
    const taskFn = sinon.fake.resolves(undefined);
    const executor = new RepeatingExecutor<void>({
      task: { execute: taskFn },
      scheduleProvider: new IntervalScheduleProvider({ intervalMs: 1000 }),
    });

    executor.start();

    await clock.tickAsync(1000);
    await clock.tickAsync(1000);

    executor.stop();

    const callCountAfterStop = taskFn.callCount;

    await clock.tickAsync(3000);

    expect(taskFn.callCount).to.equal(callCountAfterStop);
  });
});
