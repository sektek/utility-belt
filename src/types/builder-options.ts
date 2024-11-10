import { ProviderFn } from './provider.js';

type BuilderOption<T> = T | ProviderFn<T>;

/**
 * At type that represents a set of options for a builder.
 * It iterates over the keys (type P) of the type T and allows for
 * each key to be either a value of type T[P] or a provider function
 * that returns a value of type T.
 *
 * @typeParam T - The type of the object intended to be built.
 */
export type BuilderOptions<T> = {
  [P in keyof T]?: BuilderOption<T[P]>;
} & {
  [key: string]: unknown;
};
