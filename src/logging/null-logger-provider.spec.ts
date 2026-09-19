import { expect } from 'chai';

import { LoggerProvider } from './types/logger-provider.js';

import { NullLogger } from './null-logger.js';
import { NullLoggerProvider } from './null-logger-provider.js';

describe('NullLoggerProvider', function () {
  let provider: LoggerProvider;

  beforeEach(function () {
    provider = new NullLoggerProvider();
  });

  it('should return a NullLogger instance', function () {
    const logger = provider.get();
    expect(logger).to.be.instanceOf(NullLogger);
  });

  it('should return the same NullLogger instance on multiple calls', function () {
    const logger1 = provider.get();
    const logger2 = provider.get();
    expect(logger1).to.equal(logger2);
  });

  it('with should return the same provider instance', function () {
    const newProvider = provider.with({ some: 'context' });
    expect(newProvider).to.equal(provider);
  });
});
