import { CommandFn } from './command.js';

export interface Stoppable {
  stop: CommandFn;
}
