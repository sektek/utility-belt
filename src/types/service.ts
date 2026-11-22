import { Startable, StartableEvents } from './startable.js';
import { Stoppable, StoppableEvents } from './stoppable.js';
import { EventEmittingService } from './event-emitting-service.js';

/**
 * The events emitted by a {@link Service}: the {@link StartableEvents} and
 * {@link StoppableEvents} lifecycle events.
 */
export type ServiceEvents = StartableEvents & StoppableEvents;

/**
 * A component that can be both started and stopped and that emits
 * {@link ServiceEvents}. It is assignable to both {@link Startable} and
 * {@link Stoppable}.
 */
// `Startable` and `Stoppable` each extend `EventEmittingService` with their own
// event map, so their `on` and `emit` signatures differ, and an interface can't
// extend two types whose shared members aren't identical (TS2320). Omitting
// everything `EventEmittingService` provides from both, and re-declaring it
// once over `ServiceEvents`, avoids that. Unlike declaring `start` and `stop`
// here, it still picks up any change made to `Startable` or `Stoppable`, and
// `keyof` keeps working if `EventEmittingService` gains more methods.
export interface Service
  extends
    Omit<Startable, keyof EventEmittingService<StartableEvents>>,
    Omit<Stoppable, keyof EventEmittingService<StoppableEvents>>,
    EventEmittingService<ServiceEvents> {}
