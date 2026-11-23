import { expect, use } from 'chai';
import { EventEmitter } from 'eventemitter3';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import {
  ExecutionError,
  ParallelExecutionStrategy,
} from './execution-strategies/index.js';
import {
  SERVICE_STARTED,
  SERVICE_START_ERROR,
  SERVICE_STOPPED,
  SERVICE_STOP_ERROR,
} from './types/index.js';
import { ProcessManager } from './process-manager.js';

use(chaiAsPromised);

const emitting = <T extends object>(service: T) =>
  Object.assign(new EventEmitter(), service);

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
      manager.add(emitting({ start }));
      await manager.start();
      expect(start.calledOnce).to.be.true;
    });

    it('accepts a Stoppable', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop }));
      await manager.stop();
      expect(stop.calledOnce).to.be.true;
    });

    it('accepts a service that is both Startable and Stoppable', async function () {
      const start = sinon.stub().resolves();
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ start, stop }));
      await manager.start();
      await manager.stop();
      expect(start.calledOnce).to.be.true;
      expect(stop.calledOnce).to.be.true;
    });
  });

  describe('remove', function () {
    it('stops calling start on a removed startable', async function () {
      const start = sinon.stub().resolves();
      const service = emitting({ start });
      manager = new ProcessManager({ name: 'test' });
      manager.add(service);
      manager.remove(service);
      await manager.start();
      expect(start.called).to.be.false;
    });

    it('stops calling stop on a removed stoppable', async function () {
      const stop = sinon.stub().resolves();
      const service = emitting({ stop });
      manager = new ProcessManager({ name: 'test' });
      manager.add(service);
      manager.remove(service);
      await manager.stop();
      expect(stop.called).to.be.false;
    });

    it('removes SIGTERM and SIGINT listeners once the last stoppable is removed', function () {
      const service = emitting({ stop: sinon.stub().resolves() });
      manager = new ProcessManager({ name: 'test' });
      const sigtermBefore = process.listenerCount('SIGTERM');
      const sigintBefore = process.listenerCount('SIGINT');

      manager.add(service);
      expect(process.listenerCount('SIGTERM')).to.equal(sigtermBefore + 1);
      expect(process.listenerCount('SIGINT')).to.equal(sigintBefore + 1);

      manager.remove(service);
      expect(process.listenerCount('SIGTERM')).to.equal(sigtermBefore);
      expect(process.listenerCount('SIGINT')).to.equal(sigintBefore);
    });

    it('keeps SIGTERM and SIGINT listeners registered while other stoppables remain', function () {
      const first = emitting({ stop: sinon.stub().resolves() });
      const second = emitting({ stop: sinon.stub().resolves() });
      manager = new ProcessManager({ name: 'test' });
      const sigtermBefore = process.listenerCount('SIGTERM');

      manager.add(first);
      manager.add(second);
      manager.remove(first);
      expect(process.listenerCount('SIGTERM')).to.equal(sigtermBefore + 1);
    });

    it('no longer calls stop on a removed service after a signal is received', async function () {
      const stop = sinon.stub().resolves();
      const service = emitting({ stop });
      manager = new ProcessManager({ name: 'test' });
      manager.add(service);
      manager.remove(service);
      process.emit('SIGTERM');
      await delay(10);
      expect(stop.called).to.be.false;
    });
  });

  describe('start', function () {
    it('calls start on all registered startables', async function () {
      const starts = [sinon.stub().resolves(), sinon.stub().resolves()];
      manager = new ProcessManager({ name: 'test' });
      starts.forEach(start => manager!.add(emitting({ start })));
      await manager.start();
      starts.forEach(start => expect(start.calledOnce).to.be.true);
    });

    it('uses the provided execution strategy', async function () {
      const order: number[] = [];
      manager = new ProcessManager({
        name: 'test',
        executionStrategy: new ParallelExecutionStrategy(),
      });
      manager.add(
        emitting({
          start: async () => {
            await delay(30);
            order.push(1);
          },
        }),
      );
      manager.add(
        emitting({
          start: async () => {
            await delay(10);
            order.push(2);
          },
        }),
      );
      await manager.start();
      expect(order).to.deep.equal([2, 1]);
    });

    it('rejects if a service start rejects', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ start: () => Promise.reject(new Error('boom')) }));
      await expect(manager.start()).to.be.rejectedWith('boom');
    });

    it('rejects with a timeout error when maxStartWaitMs is exceeded', async function () {
      manager = new ProcessManager({ name: 'test', maxStartWaitMs: 40 });
      manager.add(emitting({ start: () => delay(200) }));
      await expect(manager.start()).to.be.rejectedWith(
        "ProcessManager 'test': service 'undefined' - start timed out",
      );
    });

    it('includes the service name in the timeout error when the service is Named', async function () {
      manager = new ProcessManager({ name: 'test', maxStartWaitMs: 20 });
      manager.add(
        emitting({
          name: 'slow-service',
          start: () => delay(200),
        }),
      );
      await expect(manager.start()).to.be.rejectedWith(
        "ProcessManager 'test': service 'slow-service' - start timed out",
      );
    });

    it('applies the timeout per service, not globally', async function () {
      const order: number[] = [];
      manager = new ProcessManager({ name: 'test', maxStartWaitMs: 50 });
      manager.add(
        emitting({
          start: async () => {
            await delay(10);
            order.push(1);
          },
        }),
      );
      manager.add(
        emitting({
          start: async () => {
            await delay(10);
            order.push(2);
          },
        }),
      );
      await manager.start();
      expect(order).to.deep.equal([1, 2]);
    });

    it('does not time out when maxStartWaitMs is not set', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ start: () => delay(50) }));
      await expect(manager.start()).to.eventually.be.undefined;
    });
  });

  describe('stop', function () {
    it('calls stop on all registered stoppables', async function () {
      const stops = [sinon.stub().resolves(), sinon.stub().resolves()];
      manager = new ProcessManager({ name: 'test' });
      stops.forEach(stop => manager!.add(emitting({ stop })));
      await manager.stop();
      stops.forEach(stop => expect(stop.calledOnce).to.be.true);
    });

    it('rejects if a service stop rejects', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop: () => Promise.reject(new Error('boom')) }));
      await expect(manager.stop()).to.be.rejectedWith('boom');
    });

    it('rejects with a timeout error when maxStopWaitMs is exceeded', async function () {
      manager = new ProcessManager({ name: 'test', maxStopWaitMs: 20 });
      manager.add(emitting({ stop: () => delay(200) }));
      await expect(manager.stop()).to.be.rejectedWith(
        "ProcessManager 'test': service 'undefined' - stop timed out",
      );
    });

    it('includes the service name in the timeout error when the service is Named', async function () {
      manager = new ProcessManager({ name: 'test', maxStopWaitMs: 20 });
      manager.add(
        emitting({
          name: 'slow-service',
          stop: () => delay(200),
        }),
      );
      await expect(manager.stop()).to.be.rejectedWith(
        "ProcessManager 'test': service 'slow-service' - stop timed out",
      );
    });

    it('does not time out when maxStopWaitMs is not set', async function () {
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop: () => delay(50) }));
      await expect(manager.stop()).to.eventually.be.undefined;
    });
  });

  describe('signal handling', function () {
    it('calls stop when SIGTERM is received', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop }));
      process.emit('SIGTERM');
      await delay(10);
      expect(stop.calledOnce).to.be.true;
    });

    it('calls stop when SIGINT is received', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop }));
      process.emit('SIGINT');
      await delay(10);
      expect(stop.calledOnce).to.be.true;
    });

    it('removes SIGTERM and SIGINT listeners after stop is called', async function () {
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop }));
      await manager.stop();
      process.emit('SIGTERM');
      process.emit('SIGINT');
      await delay(10);
      expect(stop.calledOnce).to.be.true;
    });
  });

  describe('lifecycle events', function () {
    let log: string[];

    const record = (target: ProcessManager, label: string) => {
      target.on(SERVICE_STARTED, () => log.push(`${label}:started`));
      target.on(SERVICE_STOPPED, () => log.push(`${label}:stopped`));
      target.on(SERVICE_START_ERROR, () => log.push(`${label}:startError`));
      target.on(SERVICE_STOP_ERROR, () => log.push(`${label}:stopError`));
    };

    beforeEach(function () {
      log = [];
    });

    it('emits service:started once, after every service has started', async function () {
      manager = new ProcessManager({ name: 'test' });
      record(manager, 'manager');
      manager.add(
        emitting({
          start: async () => {
            await delay(10);
            log.push('first:done');
          },
        }),
      );
      manager.add(
        emitting({
          start: async () => {
            log.push('second:done');
          },
        }),
      );
      await manager.start();
      expect(log).to.deep.equal([
        'first:done',
        'second:done',
        'manager:started',
      ]);
    });

    it('emits service:stopped once, after every service has stopped', async function () {
      manager = new ProcessManager({ name: 'test' });
      record(manager, 'manager');
      manager.add(
        emitting({
          stop: async () => {
            await delay(10);
            log.push('first:done');
          },
        }),
      );
      manager.add(
        emitting({
          stop: async () => {
            log.push('second:done');
          },
        }),
      );
      await manager.stop();
      expect(log).to.deep.equal([
        'first:done',
        'second:done',
        'manager:stopped',
      ]);
    });

    it('emits service:startError with the rejection, then rethrows it', async function () {
      const error = new Error('boom');
      const listener = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      record(manager, 'manager');
      manager.on(SERVICE_START_ERROR, listener);
      manager.add(emitting({ start: () => Promise.reject(error) }));
      const rejection = await manager.start().catch((e: unknown) => e);
      expect(rejection).to.equal(error);
      expect(listener.calledOnceWithExactly(error)).to.be.true;
      expect(log).to.deep.equal(['manager:startError']);
    });

    it('wraps a rejection that is not an Error in the event, and rethrows the original', async function () {
      const startListener = sinon.fake();
      const stopListener = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_START_ERROR, startListener);
      manager.on(SERVICE_STOP_ERROR, stopListener);
      manager.add(
        emitting({
          start: () => Promise.reject('start failed'),
          stop: () => Promise.reject(undefined),
        }),
      );

      expect(await manager.start().catch((e: unknown) => e)).to.equal(
        'start failed',
      );
      expect(await manager.stop().catch((e: unknown) => e)).to.be.undefined;

      const [startEvent] = startListener.firstCall.args;
      expect(startEvent).to.be.instanceOf(Error);
      expect(startEvent.message).to.equal('start failed');
      expect(startEvent.cause).to.equal('start failed');
      const [stopEvent] = stopListener.firstCall.args;
      expect(stopEvent).to.be.instanceOf(Error);
      expect(stopEvent.cause).to.be.undefined;
    });

    it('emits service:stopError with the rejection, then rethrows it', async function () {
      const error = new Error('boom');
      const listener = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      record(manager, 'manager');
      manager.on(SERVICE_STOP_ERROR, listener);
      manager.add(emitting({ stop: () => Promise.reject(error) }));
      const rejection = await manager.stop().catch((e: unknown) => e);
      expect(rejection).to.equal(error);
      expect(listener.calledOnceWithExactly(error)).to.be.true;
      expect(log).to.deep.equal(['manager:stopError']);
    });

    it('emits service:startError with the timeout error when a service exceeds maxStartWaitMs', async function () {
      const listener = sinon.fake();
      manager = new ProcessManager({ name: 'test', maxStartWaitMs: 20 });
      manager.on(SERVICE_START_ERROR, listener);
      manager.add(emitting({ start: () => delay(200) }));
      const rejection = await manager.start().catch((e: unknown) => e);
      expect(rejection).to.be.instanceOf(Error);
      expect(listener.firstCall.args[0]).to.equal(rejection);
      expect((rejection as Error).message).to.contain('start timed out');
    });

    it('emits service:stopError with the timeout error when a service exceeds maxStopWaitMs', async function () {
      const listener = sinon.fake();
      manager = new ProcessManager({ name: 'test', maxStopWaitMs: 20 });
      manager.on(SERVICE_STOP_ERROR, listener);
      manager.add(emitting({ stop: () => delay(200) }));
      const rejection = await manager.stop().catch((e: unknown) => e);
      expect(rejection).to.be.instanceOf(Error);
      expect(listener.firstCall.args[0]).to.equal(rejection);
      expect((rejection as Error).message).to.contain('stop timed out');
    });

    it('emits the original error of the first failing service with the serial strategy', async function () {
      const first = new Error('first');
      const listener = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_START_ERROR, listener);
      manager.add(emitting({ start: () => Promise.reject(first) }));
      manager.add(
        emitting({ start: () => Promise.reject(new Error('second')) }),
      );
      await expect(manager.start()).to.be.rejected;
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal(first);
    });

    it('emits an ExecutionError containing every failure with the parallel strategy', async function () {
      const first = new Error('first');
      const second = new Error('second');
      const listener = sinon.fake();
      manager = new ProcessManager({
        name: 'test',
        executionStrategy: new ParallelExecutionStrategy(),
      });
      manager.on(SERVICE_START_ERROR, listener);
      manager.add(emitting({ start: () => Promise.reject(first) }));
      manager.add(emitting({ start: () => Promise.reject(second) }));
      const rejection = await manager.start().catch((e: unknown) => e);
      expect(rejection).to.be.instanceOf(ExecutionError);
      expect(listener.calledOnce).to.be.true;
      expect(listener.firstCall.args[0]).to.equal(rejection);
      expect((rejection as ExecutionError).errors).to.have.members([
        first,
        second,
      ]);
    });

    it('emits each nested manager own events once, child before parent', async function () {
      const parent = new ProcessManager({ name: 'parent' });
      manager = new ProcessManager({ name: 'child', processManager: parent });
      record(parent, 'parent');
      record(manager, 'child');
      manager.add(
        emitting({
          start: async () => undefined,
          stop: async () => undefined,
        }),
      );
      await parent.start();
      await parent.stop();
      expect(log).to.deep.equal([
        'child:started',
        'parent:started',
        'child:stopped',
        'parent:stopped',
      ]);
    });

    it('reports a failure at every level of nested managers', async function () {
      const error = new Error('boom');
      const parent = new ProcessManager({ name: 'parent' });
      manager = new ProcessManager({ name: 'child', processManager: parent });
      record(parent, 'parent');
      record(manager, 'child');
      manager.add(emitting({ start: () => Promise.reject(error) }));
      const rejection = await parent.start().catch((e: unknown) => e);
      expect(rejection).to.equal(error);
      expect(log).to.deep.equal(['child:startError', 'parent:startError']);
    });

    it('does not forward the events of its services', async function () {
      const service = new EventEmitter();
      const listener = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_STARTED, listener);
      manager.add(
        Object.assign(service, {
          start: async () => {
            service.emit(SERVICE_STARTED);
          },
        }),
      );
      await manager.start();
      expect(listener.calledOnce).to.be.true;
    });
  });

  describe('idempotency', function () {
    it('shares one run between concurrent stop calls', async function () {
      const stop = sinon.stub().callsFake(() => delay(10));
      const stopped = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_STOPPED, stopped);
      manager.add(emitting({ stop }));
      await Promise.all([manager.stop(), manager.stop()]);
      expect(stop.calledOnce).to.be.true;
      expect(stopped.calledOnce).to.be.true;
    });

    it('shares one run between concurrent start calls', async function () {
      const start = sinon.stub().callsFake(() => delay(10));
      const started = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_STARTED, started);
      manager.add(emitting({ start }));
      await Promise.all([manager.start(), manager.start()]);
      expect(start.calledOnce).to.be.true;
      expect(started.calledOnce).to.be.true;
    });

    it('gives concurrent callers the same rejection', async function () {
      const error = new Error('boom');
      const stopError = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_STOP_ERROR, stopError);
      manager.add(emitting({ stop: () => Promise.reject(error) }));
      const results = await Promise.all([
        manager.stop().catch((e: unknown) => e),
        manager.stop().catch((e: unknown) => e),
      ]);
      expect(results).to.deep.equal([error, error]);
      expect(stopError.calledOnce).to.be.true;
    });

    it('runs a signal and an explicit stop once', async function () {
      const stop = sinon.stub().callsFake(() => delay(10));
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop }));
      process.emit('SIGTERM');
      await manager.stop();
      expect(stop.calledOnce).to.be.true;
    });

    it('does not stop the services again after a completed stop', async function () {
      const stop = sinon.stub().resolves();
      const stopped = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_STOPPED, stopped);
      manager.add(emitting({ stop }));
      await manager.stop();
      await manager.stop();
      expect(stop.calledOnce).to.be.true;
      expect(stopped.calledOnce).to.be.true;
    });

    it('does not start the services again after a completed start', async function () {
      const start = sinon.stub().resolves();
      const started = sinon.fake();
      manager = new ProcessManager({ name: 'test' });
      manager.on(SERVICE_STARTED, started);
      manager.add(emitting({ start }));
      await manager.start();
      await manager.start();
      expect(start.calledOnce).to.be.true;
      expect(started.calledOnce).to.be.true;
    });

    it('stops a service added after a completed stop', async function () {
      const first = sinon.stub().resolves();
      const second = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop: first }));
      await manager.stop();
      manager.add(emitting({ stop: second }));
      await manager.stop();
      expect(second.calledOnce).to.be.true;
    });

    it('runs a stop again after a failed stop', async function () {
      const stop = sinon.stub();
      stop.onFirstCall().rejects(new Error('boom'));
      stop.onSecondCall().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ stop }));
      await expect(manager.stop()).to.be.rejectedWith('boom');
      await expect(manager.stop()).to.eventually.be.undefined;
      expect(stop.calledTwice).to.be.true;
    });

    it('runs a start again after a failed start', async function () {
      const start = sinon.stub();
      start.onFirstCall().rejects(new Error('boom'));
      start.onSecondCall().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ start }));
      await expect(manager.start()).to.be.rejectedWith('boom');
      await expect(manager.start()).to.eventually.be.undefined;
      expect(start.calledTwice).to.be.true;
    });

    it('starts the services again after a completed stop', async function () {
      const start = sinon.stub().resolves();
      const stop = sinon.stub().resolves();
      manager = new ProcessManager({ name: 'test' });
      manager.add(emitting({ start, stop }));
      await manager.start();
      await manager.stop();
      await manager.start();
      await manager.stop();
      expect(start.calledTwice).to.be.true;
      expect(stop.calledTwice).to.be.true;
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
      manager.add(emitting({ start, stop }));
      await parent.start();
      await parent.stop();
      expect(start.calledOnce).to.be.true;
      expect(stop.calledOnce).to.be.true;
    });

    it('does not register SIGTERM or SIGINT listeners when a processManager is provided', async function () {
      // Give the parent a stoppable of its own first, so its lazily
      // registered signal listener is already in place before the baseline
      // is captured below.
      parent.add(emitting({ stop: sinon.stub().resolves() }));
      const sigtermBefore = process.listenerCount('SIGTERM');
      const sigintBefore = process.listenerCount('SIGINT');
      manager = new ProcessManager({ name: 'child', processManager: parent });
      expect(process.listenerCount('SIGTERM')).to.equal(sigtermBefore);
      expect(process.listenerCount('SIGINT')).to.equal(sigintBefore);
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
