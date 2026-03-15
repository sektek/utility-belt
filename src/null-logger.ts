import { Logger } from './types/logger.js';
import { noOp } from './no-op.js';

/**
 * A Logger implementation that does nothing. All methods are no-ops.
 */
export class NullLogger implements Logger {
  debug = noOp;
  info = noOp;
  warn = noOp;
  error = noOp;
  log = noOp;

  isLevelEnabled = () => false;
  isDebugEnabled = () => false;
  isInfoEnabled = () => false;
  isWarnEnabled = () => false;
  isErrorEnabled = () => false;

  child() {
    return this;
  }
}
