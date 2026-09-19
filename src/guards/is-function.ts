// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isFunction = (value: unknown): value is () => any =>
  typeof value === 'function';
