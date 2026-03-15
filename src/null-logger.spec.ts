import { expect } from 'chai';

import { Logger } from './types/logger.js';
import { NullLogger } from './null-logger.js';

describe('NullLogger', function () {
  let logger: Logger;

  beforeEach(function () {
    logger = new NullLogger();
  });

  it('should not throw when calling log', function () {
    expect(() => logger.log('info', 'Log message')).to.not.throw();
  });

  it('should not throw when calling debug', function () {
    expect(() => logger.debug('Debug message')).to.not.throw();
  });

  it('should not throw when calling info', function () {
    expect(() => logger.info('Info message')).to.not.throw();
  });

  it('should not throw when calling warn', function () {
    expect(() => logger.warn('Warn message')).to.not.throw();
  });

  it('should not throw when calling error', function () {
    expect(() => logger.error('Error message')).to.not.throw();
  });

  it('should return false for all isLevelEnabled checks', function () {
    expect(logger.isLevelEnabled('any')).to.be.false;
  });

  it('should return false for isDebugEnabled', function () {
    expect(logger.isDebugEnabled()).to.be.false;
  });

  it('should return false for isInfoEnabled', function () {
    expect(logger.isInfoEnabled()).to.be.false;
  });

  it('should return false for isWarnEnabled', function () {
    expect(logger.isWarnEnabled()).to.be.false;
  });

  it('should return false for isErrorEnabled', function () {
    expect(logger.isErrorEnabled()).to.be.false;
  });

  it('child should return the same instance', function () {
    const childLogger = logger.child({ some: 'context' });
    expect(childLogger).to.equal(logger);
  });
});
