// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventDefinition = Record<string, (...args: any) => any>;

/**
 * An interface to define specific events that can be emitted by a service.
 * This ensures that the events are typed correctly.
 *
 * @typeParam T - The event definition.
 * @example
 * ```ts
 * type MyEvents = {
 *  'someEvent': (data: string) => void;
 * };
 *
 * class MyService
 *   extends EventEmitter
 *   implements EventEmittingService<MyEvents> {
 *  // ...
 * }
 * ```
 */
export interface EventEmittingService<T extends EventDefinition> {
  on<E extends keyof T>(event: E, listener: T[E]): this;
  emit<E extends keyof T>(event: E, ...args: Parameters<T[E]>): boolean;
}
