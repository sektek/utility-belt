import { EventEmitter } from 'eventemitter3';
import { expect } from 'chai';

import {
  EventEmittingService,
  SERVICE_STARTED,
  SERVICE_START_ERROR,
  SERVICE_STOPPED,
  SERVICE_STOP_ERROR,
  StartableEvents,
  StoppableEvents,
} from '../index.js';

describe('lifecycle event types', function () {
  it('pins the wire format of the lifecycle event names', function () {
    expect(SERVICE_STARTED).to.equal('service:started');
    expect(SERVICE_START_ERROR).to.equal('service:startError');
    expect(SERVICE_STOPPED).to.equal('service:stopped');
    expect(SERVICE_STOP_ERROR).to.equal('service:stopError');
  });

  it('accepts listeners of the expected shape', function () {
    const errors: Error[] = [];
    const listeners: StartableEvents & StoppableEvents = {
      [SERVICE_STARTED]: () => {},
      [SERVICE_STOPPED]: () => {},
      [SERVICE_START_ERROR]: error => {
        errors.push(error);
      },
      [SERVICE_STOP_ERROR]: async error => {
        errors.push(error);
      },
    };

    listeners[SERVICE_START_ERROR](new Error('a'));
    listeners[SERVICE_STOP_ERROR](new Error('b'));

    expect(errors.map(e => e.message)).to.deep.equal(['a', 'b']);
  });

  it('types an emitter as an EventEmittingService of the events', function () {
    class Emitter
      extends EventEmitter
      implements EventEmittingService<StartableEvents & StoppableEvents> {}

    const emitter = new Emitter();
    let started = 0;
    let error: Error | undefined;
    emitter.on(SERVICE_STARTED, () => started++);
    emitter.on(SERVICE_START_ERROR, err => {
      error = err;
    });
    emitter.emit(SERVICE_STARTED);
    emitter.emit(SERVICE_START_ERROR, new Error('boom'));

    expect(started).to.equal(1);
    expect(error?.message).to.equal('boom');
  });
});
