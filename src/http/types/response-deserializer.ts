import { Component } from '../../types/index.js';

export type ResponseDeserializerFn<T> = (
  response: Response,
) => T | PromiseLike<T>;

export interface ResponseDeserializer<T> {
  deserialize: ResponseDeserializerFn<T>;
}

export type ResponseDeserializerComponent<T> = Component<
  ResponseDeserializer<T>,
  'deserialize'
>;
