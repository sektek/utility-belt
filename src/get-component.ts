import {
  SyncProviderComponent,
  SyncProviderFn,
} from './types/sync-provider.js';
import { InvalidComponentError } from './errors/invalid-component-error.js';
import { isA } from './is-a.js';

export type GetComponentOptions<T> = {
  default?: T;
  defaultProvider?: SyncProviderComponent<T, void>;
  errorMessage?: string;
  name?: string;
};

/**
 * Retrieves a component function from the provided object, or acts as a pass-through
 * if the object is a function. If the specified function name does not exist on the
 * object, it will throw an error unless a default value is provided.
 * @param obj - The object or function from which to retrieve the component.
 *              If the object is a function, it will return the function directly.
 * @param fnNames - The name(s) of the function(s) to retrieve from the object.
 *                  If multiple names are provided, it will return the first one found.
 * @param opts - Options to customize the behavior of the function retrieval.
 *               - `default`: A default value to return if the function is not found.
 *               - `defaultProvider`: A provider that can be used to get a default value.
 *                 This should be a synchronous provider component that returns the default value.
 *                 It is useful when the default value requires some initialization or computation.
 *               - `errorMessage`: Custom error message to throw if the function is not found.
 *               - `name`: A name to use in the error message for better context.
 * @template T - The type of the object or function being passed.
 * @template R - The type of the function being retrieved, which extends T and is a function.
 * @throws {InvalidComponentError} If the function is not found and no default is provided.
 * @returns {R} - The retrieved function, bound to the original object if applicable.
 */
// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const getComponent = <T, R extends T & Function>(
  obj: T | null | undefined,
  fnNames: string | string[],
  opts: GetComponentOptions<T> = {},
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

  const errorMessage =
    opts.errorMessage || `Invalid ${opts.name || 'component'}`;

  if (opts.defaultProvider) {
    const providerFn: SyncProviderFn<T, void> = getComponent(
      opts.defaultProvider,
      'get',
    );
    return getComponent<T, R>(providerFn(), fnNames, {
      errorMessage: `Default Provider: ${errorMessage}`,
    });
  }

  if (opts.default) {
    return getComponent<T, R>(opts.default, fnNames, {
      errorMessage: `Default Value: ${errorMessage}`,
    });
  }

  throw new InvalidComponentError(obj, errorMessage);
};
