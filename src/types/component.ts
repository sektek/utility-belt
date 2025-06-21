/**
 * Component type that extracts a specific method from an object type.
 * It takes a type T and a key K, and returns a type that includes the method
 * corresponding to the key K from T, or a function that matches the method's signature.
 *
 * Used to create a type that can either be the original type T or a function
 * that matches the method signature of T[K]. Components are intended to be used
 * within class constructor options allowing for a more flexible interface and should
 * be combined with the `getComponent` utility for extracting the component.
 *
 * @typeParam T - The type from which to extract the method.
 * @typeParam K - The key of the method to extract from T.
 *                It must be a key of T that corresponds to a function.
 * @returns A type that is either T or a function matching the signature of T[K].
 *          If T is never, it returns never.
 *          If K is not a key of T or T[K] is not a function, it returns never.
 * @example
 * // Example usage:
 * interface MyComponent {
 *   doSomething: (arg: string) => number;
 * }
 * type MyComponentWithDoSomething = Component<MyComponent, 'doSomething'>;
 * // This will be equivalent to:
 * // type MyComponentWithDoSomething = MyComponent | ((arg: string) => number);
 */
export type Component<T, K extends string> = T extends never
  ? never
  : K extends keyof T
    ? T[K] extends (...args: infer A) => infer R
      ? T | ((...args: A) => R)
      : never
    : never;
