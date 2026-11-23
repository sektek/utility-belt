import { EventEmitter } from 'eventemitter3';
import { expect } from 'chai';

import {
  SERVICE_STARTED,
  SERVICE_START_ERROR,
  SERVICE_STOPPED,
  SERVICE_STOP_ERROR,
  Service,
  Startable,
  Stoppable,
} from './index.js';

describe('Service', function () {
  it('accepts listeners for every lifecycle event and is a Startable and Stoppable', function () {
    const emitter = Object.assign(new EventEmitter(), {
      start: async () => undefined,
      stop: async () => undefined,
    });
    const service: Service = emitter;
    const startable: Startable = service;
    const stoppable: Stoppable = service;
    const seen: string[] = [];
    const record = (name: string) => () => {
      seen.push(name);
    };

    service.on(SERVICE_STARTED, record(SERVICE_STARTED));
    service.on(SERVICE_STOPPED, record(SERVICE_STOPPED));
    service.on(SERVICE_START_ERROR, record(SERVICE_START_ERROR));
    service.on(SERVICE_STOP_ERROR, record(SERVICE_STOP_ERROR));
    startable.emit(SERVICE_STARTED);
    stoppable.emit(SERVICE_STOPPED);
    service.emit(SERVICE_START_ERROR, new Error('start'));
    service.emit(SERVICE_STOP_ERROR, new Error('stop'));

    expect(seen).to.deep.equal([
      SERVICE_STARTED,
      SERVICE_STOPPED,
      SERVICE_START_ERROR,
      SERVICE_STOP_ERROR,
    ]);
  });
});
