export type Component<T, K extends string> = T extends never
  ? never
  : K extends keyof T
    ? T[K] extends (...args: infer A) => infer R
      ? T | ((...args: A) => R)
      : never
    : never;
