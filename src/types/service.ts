import { Startable, StartableEvents } from './startable.js';
import { Stoppable, StoppableEvents } from './stoppable.js';

/**
 * The events emitted by a {@link Service}: the {@link StartableEvents} and
 * {@link StoppableEvents} lifecycle events.
 */
export type ServiceEvents = StartableEvents & StoppableEvents;

export interface Service extends Startable, Stoppable {}
