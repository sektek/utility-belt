import { expect, use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { DefaultLoggerProvider } from './default-logger-provider.js';
import { Logger } from './types/logger.js';

use(sinonChai);

describe('DefaultLoggerProvider', function () {
  let childLogger: Logger;
  let logger: Logger;

  beforeEach(function () {
    childLogger = {} as Logger;
    logger = { child: sinon.fake.returns(childLogger) } as unknown as Logger;
  });

  describe('get()', function () {
    it('should return the child logger', function () {
      const provider = new DefaultLoggerProvider({ logger });
      expect(provider.get()).to.equal(childLogger);
    });

    it('should call logger.child with an empty context by default', function () {
      const provider = new DefaultLoggerProvider({ logger });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({});
    });

    it('should call logger.child with the configured static context', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        context: { service: 'test' },
      });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({ service: 'test' });
    });

    it('should call a contextProvider function with the provided object', function () {
      const contextProvider = sinon.fake.returns({ requestId: '123' });
      const provider = new DefaultLoggerProvider({
        logger,
        contextProviders: [contextProvider],
      });
      const obj = { userId: 'user1' };
      provider.get(obj);
      expect(contextProvider).to.have.been.calledOnceWith(obj);
    });

    it('should include context from a contextProvider function', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        contextProviders: [() => ({ requestId: '123' })],
      });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({ requestId: '123' });
    });

    it('should include context from a contextProvider object', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        contextProviders: [{ get: () => ({ requestId: '123' }) }],
      });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({ requestId: '123' });
    });

    it('should merge static context with contextProvider context', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        context: { service: 'test' },
        contextProviders: [() => ({ requestId: '123' })],
      });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({
        service: 'test',
        requestId: '123',
      });
    });

    it('should merge context from multiple contextProviders', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        contextProviders: [
          () => ({ requestId: '123' }),
          () => ({ userId: 'user1' }),
        ],
      });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({
        requestId: '123',
        userId: 'user1',
      });
    });

    it('contextProvider context should override static context for the same key', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        context: { service: 'original' },
        contextProviders: [() => ({ service: 'override' })],
      });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({
        service: 'override',
      });
    });
  });

  describe('with()', function () {
    it('should return a new provider instance', function () {
      const provider = new DefaultLoggerProvider({ logger });
      expect(provider.with({})).to.not.equal(provider);
    });

    it('should merge context into the new provider', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        context: { service: 'test' },
      });
      provider.with({ requestId: '123' }).get();
      expect(logger.child).to.have.been.calledOnceWith({
        service: 'test',
        requestId: '123',
      });
    });

    it('should not affect the original provider', function () {
      const provider = new DefaultLoggerProvider({
        logger,
        context: { service: 'test' },
      });
      provider.with({ requestId: '123' });
      provider.get();
      expect(logger.child).to.have.been.calledOnceWith({ service: 'test' });
    });

    it('should append contextProviders to the new provider', function () {
      const originalProvider = sinon.fake.returns({ a: 1 });
      const additionalProvider = sinon.fake.returns({ b: 2 });
      const obj = {};

      const provider = new DefaultLoggerProvider({
        logger,
        contextProviders: [originalProvider],
      });
      provider.with({}, additionalProvider).get(obj);

      expect(originalProvider).to.have.been.calledOnceWith(obj);
      expect(additionalProvider).to.have.been.calledOnceWith(obj);
      expect(logger.child).to.have.been.calledOnceWith({ a: 1, b: 2 });
    });

    it('should not invoke new contextProviders on the original provider', function () {
      const additionalProvider = sinon.fake.returns({ b: 2 });
      const provider = new DefaultLoggerProvider({ logger });
      provider.with({}, additionalProvider);
      provider.get();
      expect(additionalProvider).to.not.have.been.called;
    });

    it('should support chaining multiple with() calls', function () {
      const provider = new DefaultLoggerProvider({ logger });
      provider.with({ service: 'test' }).with({ version: '1.0' }).get();
      expect(logger.child).to.have.been.calledOnceWith({
        service: 'test',
        version: '1.0',
      });
    });
  });
});
