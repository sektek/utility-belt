import { ProviderFn } from './provider.js';

type BuilderOption<T> = T | ProviderFn<T>;

export type BuilderOptions<T> = {
  [P in keyof T]?: BuilderOption<T[P]>;
} & {
  [key: string]: unknown;
};
