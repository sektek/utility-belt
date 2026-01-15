import { CommandFn } from './command.js';

export interface Startable {
  start: CommandFn;
}
