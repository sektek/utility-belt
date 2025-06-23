import { Component } from '@sektek/utility-belt';

// Having some typing issues with BodyInit and fetch
// So I'm commenting out the types that are causing conflicts
type BodyInit =
  | ArrayBuffer
  // | AsyncIterable<Uint8Array>
  | Blob
  | FormData
  // | Iterable<Uint8Array>
  // | ArrayBufferView
  | URLSearchParams
  | null
  | string;

type BodySerializerReturnType = undefined | BodyInit;

export type BodySerializerFn<T = unknown> = (
  arg: T,
) => BodySerializerReturnType | PromiseLike<BodySerializerReturnType>;

export interface BodySerializer<T = unknown> {
  serialize: BodySerializerFn<T>;
}

export type BodySerializerComponent<T = unknown> = Component<
  BodySerializer<T>,
  'serialize'
>;
