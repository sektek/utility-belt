import { ProviderFn } from './provider.js';

/**
 * A type that represents a set of options for a builder.
 * It iterates over the keys (type P) of the type T and allows for
 * each key to be either a value of type T[P] or a provider function
 * that returns a value of type T.
 *
 * @typeParam T - The type of the object intended to be built.
 */
export type BuilderOptions<T> = {
  [P in keyof T as P extends string ? P : never]?:
    | T[P]
    | ProviderFn<T[P], Partial<BuilderOptions<T[P]>>>
    | BuilderOptions<T[P]>;
};

/**
 * BuilderFn is a function type that defines how to create an object of type T
 * using the provided options. It can be used to build complex objects by
 * combining static values and provider functions.
 *
 * @typeParam T - The type of the object to be built.
 */
export type BuilderFn<T> = ProviderFn<T, Partial<BuilderOptions<T>>>;

/**
 * Builder is an interface that defines a method to create an object of type T
 * using a BuilderFn. It allows for the creation of objects with dynamic
 * properties and values, which can be either static or provided by functions.
 *
 * @typeParam T - The type of the object to be built.
 */
export interface Builder<T> {
  create: BuilderFn<T>;
}
