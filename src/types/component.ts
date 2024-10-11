export type Component<T, K extends keyof T> = T[K] extends (
  ...args: infer A
) => infer R
  ? T | ((...args: A) => R) | R
  : never;
