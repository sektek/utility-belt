import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import { ParallelExecutionStrategy } from './execution-strategies/index.js';
import { ProcessManager } from './process-manager.js';

use(chaiAsPromised);

const delay = (ms: number) =>
  new Promise<void>(resolve => setTimeout(resolve, ms));

describe('ProcessManager', function () {
  let manager: ProcessManager | undefined;

  afterEach(async function () {
    // Ensure signal listeners are always cleaned up between tests.
    await manager?.stop().catch(() => undefined);
    manager = undefined;
  });

  describe('constructor', function () {
    it('exposes the provided name', function () {
      manager = new ProcessManager({ name: 'test' });
      expect(manager.name).to.equal('test');
    });
  });

  describe('add', function () {
    it('accepts a Startable', async function () {
      const start = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add({ start });
      await manager.start();
      expect(start.calledOnce).to.be.true;
    });

    it('accepts a Stoppable', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add({ stop });
      await manager.stop();
      expect(stop.calledOnce).to.be.true;
    });

    it('accepts a service that is both Startable and Stoppable', async function () {
      const start = sinon.stub().resolves();
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add({ start, stop });
      await manager.start();
      await manager.stop();
      expect(start.calledOnce).to.be.true;
      expect(stop.calledOnce).to.be.true;
    });
  });

  describe('start', function () {
    it('calls start on all registered startables', async function () {
      const starts = [sinon.stub().resolves(), sinon.stub().resolves()];
      manager = new ProcessManager({ name: 'test' });
      starts.forEach(start => manager!.add({ start }));
      await manager.start();
      starts.forEach(start => expect(start.calledOnce).to.be.true);
    });

    it('uses the provided execution strategy', async function () {
      const order: number[] = [];
      manager = new ProcessManager({
        name: 'test',
        executionStrategy: new ParallelExecutionStrategy(),
      });
      manager.add({
        start: async () => {
          await delay(30);
          order.push(1);
        },
      });
      manager.add({
        start: async () => {
          await delay(10);
          order.push(2);
        },
      });
      await manager.start();
      expect(order).to.deep.equal([2, 1]);
    });

    it('rejects if a service start rejects', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add({ start: () => Promise.reject(new Error('boom')) });
      await expect(manager.start()).to.be.rejectedWith('boom');
    });

    it('rejects with a timeout error when maxStartWaitMs is exceeded', async function () {
      manager = new ProcessManager({ name: 'test', maxStartWaitMs: 20 });
      manager.add({ start: () => delay(200) });
      await expect(manager.start()).to.be.rejectedWith(
        "ProcessManager 'test': service start timed out",
      );
    });

    it('includes the service name in the timeout error when the service is Named', async function () {
      manager = new ProcessManager({ name: 'test', maxStartWaitMs: 20 });
      manager.add({
        name: 'slow-service',
        start: () => delay(200),
      } as Parameters<ProcessManager['add']>[0]);
      await expect(manager.start()).to.be.rejectedWith(
        "ProcessManager 'test': service 'slow-service' start timed out",
      );
    });

    it('applies the timeout per service, not globally', async function () {
      const order: number[] = [];
      manager = new ProcessManager({ name: 'test', maxStartWaitMs: 50 });
      manager.add({
        start: async () => {
          await delay(10);
          order.push(1);
        },
      });
      manager.add({
        start: async () => {
          await delay(10);
          order.push(2);
        },
      });
      await manager.start();
      expect(order).to.deep.equal([1, 2]);
    });

    it('does not time out when maxStartWaitMs is not set', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add({ start: () => delay(50) });
      await expect(manager.start()).to.eventually.be.undefined;
    });
  });

  describe('stop', function () {
    it('calls stop on all registered stoppables', async function () {
      const stops = [sinon.stub().resolves(), sinon.stub().resolves()];
      manager = new ProcessManager({ name: 'test' });
      stops.forEach(stop => manager!.add({ stop }));
      await manager.stop();
      stops.forEach(stop => expect(stop.calledOnce).to.be.true);
    });

    it('rejects if a service stop rejects', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add({ stop: () => Promise.reject(new Error('boom')) });
      await expect(manager.stop()).to.be.rejectedWith('boom');
    });

    it('rejects with a timeout error when maxStopWaitMs is exceeded', async function () {
      manager = new ProcessManager({ name: 'test', maxStopWaitMs: 20 });
      manager.add({ stop: () => delay(200) });
      await expect(manager.stop()).to.be.rejectedWith(
        "ProcessManager 'test': service stop timed out",
      );
    });

    it('includes the service name in the timeout error when the service is Named', async function () {
      manager = new ProcessManager({ name: 'test', maxStopWaitMs: 20 });
      manager.add({
        name: 'slow-service',
        stop: () => delay(200),
      } as Parameters<ProcessManager['add']>[0]);
      await expect(manager.stop()).to.be.rejectedWith(
        "ProcessManager 'test': service 'slow-service' stop timed out",
      );
    });

    it('does not time out when maxStopWaitMs is not set', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add({ stop: () => delay(50) });
      await expect(manager.stop()).to.eventually.be.undefined;
    });
  });

  describe('signal handling', function () {
    it('calls stop when SIGTERM is received', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add({ stop });
      process.emit('SIGTERM');
      await delay(10);
      expect(stop.calledOnce).to.be.true;
    });

    it('calls stop when SIGINT is received', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add({ stop });
      process.emit('SIGINT');
      await delay(10);
      expect(stop.calledOnce).to.be.true;
    });

    it('removes SIGTERM and SIGINT listeners after stop is called', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add({ stop });
      await manager.stop();
      process.emit('SIGTERM');
      process.emit('SIGINT');
      await delay(10);
      expect(stop.calledOnce).to.be.true;
    });
  });

  describe('parent', function () {
    let parent: ProcessManager;

    beforeEach(function () {
      parent = new ProcessManager({ name: 'parent' });
    });

    afterEach(async function () {
      await parent.stop().catch(() => undefined);
    });

    it('registers itself with the processManager on construction', async function () {
      const start = sinon.stub().resolves();
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'child', processManager: parent });
      manager.add({ start, stop });
      await parent.start();
      await parent.stop();
      expect(start.calledOnce).to.be.true;
      expect(stop.calledOnce).to.be.true;
    });

    it('does not register SIGTERM or SIGINT listeners when a processManager is provided', async function () {
      const listenersBefore = process.listenerCount('SIGTERM');
      manager = new ProcessManager({ name: 'child', processManager: parent });
      expect(process.listenerCount('SIGTERM')).to.equal(listenersBefore);
    });

    it('does not call process.off on stop when a processManager is provided', async function () {
      const offSpy = sinon.spy(process, 'off');
      try {
        manager = new ProcessManager({ name: 'child', processManager: parent });
        await manager.stop();
        expect(offSpy.called).to.be.false;
      } finally {
        offSpy.restore();
      }
    });
  });
});
