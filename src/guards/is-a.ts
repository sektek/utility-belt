import { isPrimitive } from './is-primitive.js';

export const isA = <T>(obj: unknown, fnName: string): obj is T =>
  !!obj &&
  !isPrimitive(obj) &&
  (obj as Record<string, unknown>)[fnName] instanceof Function;
