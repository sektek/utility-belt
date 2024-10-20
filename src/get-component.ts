import { isA } from './is-a.js';

// eslint-disable-next-line @typescript-eslint/ban-types
export const getComponent = <T, R extends T & Function>(
  obj: T | null | undefined,
  fnNames: string | string[],
  fallback?: T,
): R => {
  const result = [fnNames]
    .flat()
    .filter(fnName => isA<T>(obj, fnName))
    .map(fnName => (obj as Record<string, unknown>)[fnName] as R);

  if (result.length) {
    return result[0].bind(obj);
  }

  if (typeof obj === 'function') {
    return obj as R;
  }

  if (fallback) {
    return getComponent<T, R>(fallback, fnNames);
  }

  throw new Error('Invalid component');
};
