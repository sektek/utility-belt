import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

use(chaiAsPromised);

import { Queue } from './queue.js';

describe('Queue', function () {
  describe('constructor and start/stop', function () {
    it('should auto-start by default', async function () {
      const queue = new Queue<number>();
      await expect(queue.add(1)).to.be.fulfilled;
    });

    it('should not auto-start when requireStart is true', async function () {
      const queue = new Queue<number>({ requireStart: true });
      await expect(queue.add(1)).to.be.rejectedWith('Queue is not running');
    });

    it('should start when start() is called', async function () {
      const queue = new Queue<number>({ requireStart: true });
      queue.start();
      await expect(queue.add(1)).to.be.fulfilled;
    });

    it('should not throw when start() is called on an already running queue', function () {
      const queue = new Queue<number>();
      expect(() => queue.start()).to.not.throw();
    });

    it('should stop accepting items after stop() is called', async function () {
      const queue = new Queue<number>();
      await queue.stop();
      await expect(queue.add(1)).to.be.rejectedWith('Queue is not running');
    });

    it('should not throw when stop() is called on an already stopped queue', async function () {
      const queue = new Queue<number>({ requireStart: true });
      await expect(queue.stop()).to.be.fulfilled;
    });

    it('should allow restart after stop', async function () {
      const queue = new Queue<number>();
      await queue.stop();
      queue.start();
      await expect(queue.add(1)).to.be.fulfilled;
    });
  });

  describe('add()', function () {
    it('should add items to the queue', async function () {
      const queue = new Queue<number>();
      await queue.add(1);
      await queue.add(2);
      await queue.add(3);

      const items: number[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.deep.equal([1, 2, 3]);
    });

    it('should throw when adding to a stopped queue', async function () {
      const queue = new Queue<number>({ requireStart: true });
      await expect(queue.add(1)).to.be.rejectedWith('Queue is not running');
    });

    it('should wait when queue is full', async function () {
      const queue = new Queue<number>({
        maxSize: 2,
        queueSleepTime: 10,
      });

      await queue.add(1);
      await queue.add(2);

      let addCompleted = false;
      // eslint-disable-next-line promise/always-return, promise/prefer-await-to-then
      const addPromise = queue.add(3).then(() => {
        addCompleted = true;
      });

      // Should still be waiting
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(addCompleted).to.equal(false);

      // Consume an item to make space
      const iterator = queue[Symbol.asyncIterator]();
      await iterator.next();

      // Now the add should complete
      await addPromise;
      expect(addCompleted).to.equal(true);
    });

    it('should throw error when maxQueueWaitTime is exceeded', async function () {
      const queue = new Queue<number>({
        maxSize: 1,
        maxQueueWaitTime: 20,
        queueSleepTime: 10,
      });

      await queue.add(1);
      await expect(queue.add(2)).to.be.rejectedWith('Queue is full');
    });

    it('should handle multiple concurrent adds', async function () {
      const queue = new Queue<number>();

      await Promise.all([
        queue.add(1),
        queue.add(2),
        queue.add(3),
        queue.add(4),
        queue.add(5),
      ]);

      const items: number[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.have.lengthOf(5);
      expect(items.sort()).to.deep.equal([1, 2, 3, 4, 5]);
    });

    it('should accept maxSize of Infinity', async function () {
      const queue = new Queue<number>({ maxSize: Infinity });

      for (let i = 0; i < 1000; i++) {
        await queue.add(i);
      }

      const items: number[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.have.lengthOf(1000);
    });
  });

  describe('async iteration', function () {
    it('should yield items in FIFO order', async function () {
      const queue = new Queue<number>();

      await queue.add(1);
      await queue.add(2);
      await queue.add(3);

      const items: number[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.deep.equal([1, 2, 3]);
    });

    it('should wait when queue is empty and running', async function () {
      const queue = new Queue<number>({ sleepTime: 10 });

      const items: number[] = [];
      const iteratorPromise = (async () => {
        for await (const item of queue) {
          items.push(item);
        }
      })();

      // Give iterator time to start waiting
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(items).to.deep.equal([]);

      // Add items after iterator started
      await queue.add(1);
      await queue.add(2);

      // Give time to process
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(items).to.deep.equal([1, 2]);

      await queue.stop();
      await iteratorPromise;
    });

    it('should stop yielding when queue is stopped and empty', async function () {
      const queue = new Queue<number>();

      await queue.add(1);
      await queue.add(2);
      queue.stop();

      const items: number[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.deep.equal([1, 2]);
    });

    it('should exit immediately if queue is stopped and empty from the start', async function () {
      const queue = new Queue<number>({ requireStart: true });

      const items: number[] = [];
      const startTime = Date.now();

      for await (const item of queue) {
        items.push(item);
      }

      const elapsed = Date.now() - startTime;

      expect(items).to.deep.equal([]);
      expect(elapsed).to.be.below(100); // Should not wait
    });

    it('should handle concurrent iteration and addition', async function () {
      const queue = new Queue<number>({ sleepTime: 5 });

      const items: number[] = [];
      const iteratorPromise = (async () => {
        for await (const item of queue) {
          items.push(item);
          if (items.length === 5) break;
        }
      })();

      // Add items while iterating
      for (let i = 1; i <= 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 10));
        await queue.add(i);
      }

      await iteratorPromise;
      expect(items).to.deep.equal([1, 2, 3, 4, 5]);

      await queue.stop();
    });

    it('should only iterate once - subsequent iterations should not yield old items', async function () {
      const queue = new Queue<number>();

      await queue.add(1);
      await queue.add(2);

      // First iteration
      const firstItems: number[] = [];
      for await (const item of queue) {
        firstItems.push(item);
      }
      expect(firstItems).to.deep.equal([1, 2]);

      // Second iteration - should not yield anything since queue is empty
      const secondItems: number[] = [];
      for await (const item of queue) {
        secondItems.push(item);
        break; // Prevent infinite loop
      }
      expect(secondItems).to.deep.equal([]);
    });
  });

  describe('stop() with draining', function () {
    it('should wait for queue to drain before stopping', async function () {
      const queue = new Queue<number>({ sleepTime: 10 });

      await queue.add(1);
      await queue.add(2);
      await queue.add(3);

      const stopPromise = queue.stop();

      // Items should still be accessible
      const items: number[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      await stopPromise;
      expect(items).to.deep.equal([1, 2, 3]);
    });

    it('should force stop after maxStopWaitTime', async function () {
      const queue = new Queue<number>({
        maxStopWaitTime: 50,
        sleepTime: 10,
      });

      await queue.add(1);

      const startTime = Date.now();
      await queue.stop();
      const elapsed = Date.now() - startTime;

      // Should have stopped around maxStopWaitTime
      expect(elapsed).to.be.at.least(50);
      expect(elapsed).to.be.below(150);
    });

    it('should return immediately if queue is already empty', async function () {
      const queue = new Queue<number>();

      const startTime = Date.now();
      await queue.stop();
      const elapsed = Date.now() - startTime;

      expect(elapsed).to.be.below(50);
    });
  });

  describe('configuration options', function () {
    it('should use custom sleepTime', async function () {
      const queue = new Queue<number>({ sleepTime: 50 });

      const startTime = Date.now();

      const iteratorPromise = (async () => {
        for await (const item of queue) {
          break;
        }
      })();

      // Should wait at least one sleep cycle
      await new Promise(resolve => setTimeout(resolve, 60));
      await queue.stop();
      await iteratorPromise;

      const elapsed = Date.now() - startTime;
      expect(elapsed).to.be.at.least(50);
    });

    it('should use custom queueSleepTime', async function () {
      const queue = new Queue<number>({
        maxSize: 1,
        queueSleepTime: 50,
        maxQueueWaitTime: 200,
      });

      await queue.add(1);

      const startTime = Date.now();
      const addPromise = queue.add(2).catch(() => {});

      await new Promise(resolve => setTimeout(resolve, 130));

      // Should have waited through multiple sleep cycles
      const elapsed = Date.now() - startTime;
      expect(elapsed).to.be.at.least(100);

      await queue.stop();
      await addPromise;
    });

    it('should fallback queueSleepTime to sleepTime if not provided', async function () {
      const queue = new Queue<number>({
        maxSize: 1,
        sleepTime: 30,
        maxQueueWaitTime: 100,
      });

      await queue.add(1);

      const startTime = Date.now();
      await queue.add(2).catch(() => {});
      const elapsed = Date.now() - startTime;

      // Should have used sleepTime for queueSleepTime
      expect(elapsed).to.be.at.least(90);
    });
  });

  describe('edge cases', function () {
    it('should handle adding the same item multiple times', async function () {
      const queue = new Queue<string>();

      await queue.add('a');
      await queue.add('a');
      await queue.add('a');

      const items: string[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.deep.equal(['a', 'a', 'a']);
    });

    it('should handle objects and complex types', async function () {
      const queue = new Queue<{ id: number; name: string }>();

      await queue.add({ id: 1, name: 'Alice' });
      await queue.add({ id: 2, name: 'Bob' });

      const items: { id: number; name: string }[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.deep.equal([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]);
    });

    it('should handle null and undefined', async function () {
      const queue = new Queue<number | null | undefined>();

      await queue.add(1);
      await queue.add(null);
      await queue.add(undefined);
      await queue.add(0);

      const items: (number | null | undefined)[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.deep.equal([1, null, undefined, 0]);
    });

    it('should handle rapid start/stop cycles', async function () {
      const queue = new Queue<number>({ requireStart: true });

      queue.start();
      await queue.stop();
      queue.start();
      await queue.stop();
      queue.start();

      await expect(queue.add(1)).to.be.fulfilled;
    });

    it('should handle empty queue iteration after items were consumed', async function () {
      const queue = new Queue<number>();

      await queue.add(1);

      // First iteration consumes the item
      for await (const item of queue) {
        expect(item).to.equal(1);
      }

      // Second iteration should not hang when queue is empty and stopped
      await queue.stop();

      const items: number[] = [];
      for await (const item of queue) {
        items.push(item);
      }

      expect(items).to.deep.equal([]);
    });
  });

  describe('maxQueueWaitTime = Infinity', function () {
    it('should wait indefinitely when maxQueueWaitTime is Infinity', async function () {
      const queue = new Queue<number>({
        maxSize: 1,
        maxQueueWaitTime: Infinity,
        queueSleepTime: 10,
      });

      await queue.add(1);

      let addResolved = false;
      const addPromise = queue.add(2).then(() => {
        addResolved = true;
      });

      // Wait for a reasonable amount of time
      await new Promise(resolve => setTimeout(resolve, 100));

      // Should still be waiting
      expect(addResolved).to.equal(false);

      // Clean up - consume item and let add complete
      const iterator = queue[Symbol.asyncIterator]();
      await iterator.next();
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(addResolved).to.equal(true);
      await queue.stop();
      await addPromise;
    });
  });
});
