import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { AbstractService, ServiceOptions } from './abstract-service.js';
import {
  SERVICE_STARTED,
  SERVICE_START_ERROR,
  SERVICE_STOPPED,
  SERVICE_STOP_ERROR,
} from './types/index.js';
import { ProcessManager } from './process-manager.js';

use(chaiAsPromised);
use(sinonChai);

class ConcreteService extends AbstractService {
  constructor(opts?: ServiceOptions) {
    super(opts);
  }
}

describe('AbstractService', function () {
  let manager: ProcessManager;
  let standaloneService: ConcreteService | undefined;

  beforeEach(function () {
    manager = new ProcessManager({ name: 'test-manager' });
    standaloneService = undefined;
  });

  afterEach(async function () {
    await standaloneService?.stop().catch(() => undefined);
    await manager.stop().catch(() => undefined);
  });

  describe('constructor', function () {
    it('should register itself with the provided processManager', function () {
      const spy = sinon.spy(manager, 'add');
      const service = new ConcreteService({ processManager: manager });
      expect(spy).to.have.been.calledOnceWith(service);
    });

    it('should not add SIGTERM or SIGINT listeners when a processManager is provided', function () {
      // Give the manager a stoppable of its own first, so its lazily
      // registered signal listener is already in place before the baseline
      // is captured below.
      manager.add({ stop: sinon.stub().resolves() });
      const spy = sinon.spy(manager, 'add');
      const sigtermBefore = process.listenerCount('SIGTERM');
      const sigintBefore = process.listenerCount('SIGINT');
      const service = new ConcreteService({ processManager: manager });
      expect(spy).to.have.been.calledOnceWith(service);
      expect(process.listenerCount('SIGTERM')).to.equal(sigtermBefore);
      expect(process.listenerCount('SIGINT')).to.equal(sigintBefore);
    });

    it('should add SIGTERM and SIGINT listeners when no processManager is provided', function () {
      const sigtermBefore = process.listenerCount('SIGTERM');
      const sigintBefore = process.listenerCount('SIGINT');
      standaloneService = new ConcreteService();
      expect(process.listenerCount('SIGTERM')).to.equal(sigtermBefore + 1);
      expect(process.listenerCount('SIGINT')).to.equal(sigintBefore + 1);
    });
  });

  describe('start()', function () {
    it('should resolve to undefined by default', async function () {
      const service = new ConcreteService({ processManager: manager });
      await expect(service.start()).to.eventually.be.undefined;
    });

    it('should emit service:started once by default', async function () {
      const service = new ConcreteService({ processManager: manager });
      const started = sinon.fake();
      const startError = sinon.fake();
      service.on(SERVICE_STARTED, started);
      service.on(SERVICE_START_ERROR, startError);

      await service.start();

      expect(started).to.have.been.calledOnce;
      expect(startError).to.not.have.been.called;
    });
  });

  describe('stop()', function () {
    it('should resolve to undefined by default', async function () {
      const service = new ConcreteService({ processManager: manager });
      await expect(service.stop()).to.eventually.be.undefined;
    });

    it('should emit service:stopped once by default', async function () {
      const service = new ConcreteService({ processManager: manager });
      const stopped = sinon.fake();
      const stopError = sinon.fake();
      service.on(SERVICE_STOPPED, stopped);
      service.on(SERVICE_STOP_ERROR, stopError);

      await service.stop();

      expect(stopped).to.have.been.calledOnce;
      expect(stopError).to.not.have.been.called;
    });
  });

  describe('overriding start() and stop()', function () {
    class SilentService extends AbstractService {
      async start() {}
      async stop() {}
    }

    it('should emit nothing when the override does not emit', async function () {
      const service = new SilentService({ processManager: manager });
      const listener = sinon.fake();
      service.on(SERVICE_STARTED, listener);
      service.on(SERVICE_STOPPED, listener);

      await service.start();
      await service.stop();

      expect(listener).to.not.have.been.called;
    });
  });
});
