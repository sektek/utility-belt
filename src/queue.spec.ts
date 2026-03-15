import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Queue } from './queue.js';

use(chaiAsPromised);
use(sinonChai);

describe('Queue', function () {
  it('should process tasks in order', async function () {
    const fakeTask1 = sinon.fake();
    const fakeTask2 = sinon.fake();
    const fakeTask3 = sinon.fake();

    const queue = new Queue<() => void>();
    queue.add(fakeTask1);
    queue.add(fakeTask2);
    queue.add(fakeTask3);
    queue.add(() => queue.stop());

    for await (const task of queue) {
      task();
    }

    expect(fakeTask1).to.have.been.calledBefore(fakeTask2);
    expect(fakeTask2).to.have.been.calledBefore(fakeTask3);
  });

  it('should stop the queue when stopOnEmpty is true', async function () {
    const fakeTask1 = sinon.fake();
    const fakeTask2 = sinon.fake();

    const queue = new Queue<() => void>({ stopOnEmpty: true });
    queue.add(fakeTask1);
    queue.add(fakeTask2);

    for await (const task of queue) {
      task();
    }

    expect(fakeTask1).to.have.been.called;
    expect(fakeTask2).to.have.been.called;
  });

  it('should allow the queue to drain when stopped', async function () {
    const fakeTask1 = sinon.fake();
    const fakeTask2 = sinon.fake();

    const queue = new Queue<() => void>();
    queue.add(fakeTask1);
    queue.add(fakeTask2);
    queue.stop();

    for await (const task of queue) {
      task();
    }

    expect(fakeTask1).to.have.been.called;
    expect(fakeTask2).to.have.been.called;
  });

  it('should not allow adding tasks after stop is called', async function () {
    const queue = new Queue<number>();
    queue.stop();
    await expect(queue.add(1)).to.be.rejectedWith(
      'Cannot add items to a stopped queue',
    );
  });

  it('should wait for space to add items when maxSize is reached', async function () {
    const queue = new Queue<number>({ maxSize: 2, sleepDurationAdd: 50 });
    await queue.add(1);
    await queue.add(2);

    const addPromise = queue.add(3);
    expect(addPromise).to.not.be.fulfilled;

    // Remove an item to make space
    for await (const item of queue) {
      if (item === 1) {
        break;
      }
    }

    await expect(addPromise).to.be.fulfilled;
  });

  it('should throw an error if max wait time is exceeded when adding to a full queue', async function () {
    const queue = new Queue<number>({
      maxSize: 1,
      maxWaitAdd: 100,
      sleepDurationAdd: 50,
    });
    await queue.add(1);

    await expect(queue.add(2)).to.be.rejectedWith(
      'Queue is full and max wait time exceeded',
    );
  });

  it('should throw an error if max wait time is exceeded when stopping the queue', async function () {
    const queue = new Queue<number>({
      maxWaitStop: 100,
      sleepDurationStop: 50,
    });
    queue.add(1);

    await expect(queue.stop()).to.be.rejectedWith(
      'Queue stop timeout exceeded',
    );
  });
});
