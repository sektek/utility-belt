import { CommandFn } from './command.js';

export interface Stoppable {
  start: CommandFn;
}
