import { LoggerProvider } from './types/logger-provider.js';

import { NullLogger } from './null-logger.js';

const NULL_LOGGER = new NullLogger();

export class NullLoggerProvider implements LoggerProvider {
  get() {
    return NULL_LOGGER;
  }

  with() {
    return this;
  }
}
