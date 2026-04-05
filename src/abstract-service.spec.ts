import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { AbstractService, ServiceOptions } from './abstract-service.js';
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
  });

  describe('stop()', function () {
    it('should resolve to undefined by default', async function () {
      const service = new ConcreteService({ processManager: manager });
      await expect(service.stop()).to.eventually.be.undefined;
    });
  });
});
