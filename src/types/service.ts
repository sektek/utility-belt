import { Startable } from './startable.js';
import { Stoppable } from './stoppable.js';

export interface Service extends Startable, Stoppable {}
