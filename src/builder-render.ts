import { BuilderOptions } from './types/builder.js';
import { isFunction } from './is-function.js';

export const builderRender = async <T>(
  data: BuilderOptions<T>,
): Promise<Partial<T>> => {
  const result: Record<string, unknown> = {};

  for (const key in data) {
    if (data?.[key] !== undefined) {
      result[key] = isFunction(data?.[key]) ? await data[key]() : data?.[key];
    }
  }

  return result as Partial<T>;
};
