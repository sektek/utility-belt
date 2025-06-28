import { getComponent } from '../get-component.js';

import {
  ResponseDeserializerComponent,
  ResponseDeserializerFn,
} from './types/index.js';

import { HttpOperator, HttpOperatorOptions } from './http-operator.js';

export type HttpProviderOptions<R, T> = HttpOperatorOptions<T> & {
  responseDeserializer?: ResponseDeserializerComponent<R>;
  httpOperator?: HttpOperator<T>;
};

export class HttpProvider<R, T = unknown> {
  #httpOperator: HttpOperator<T>;
  #responseDeserializer: ResponseDeserializerFn<R>;

  constructor(opts: HttpProviderOptions<R, T>) {
    if (!opts.httpOperator && !opts.url && !opts.urlProvider) {
      throw new Error(
        'HttpProvider requires either an httpOperator, url, or urlProvider to be provided.',
      );
    }

    this.#httpOperator =
      opts.httpOperator ??
      new HttpOperator({
        method: 'GET',
        ...opts,
      });
    this.#responseDeserializer = getComponent(
      opts.responseDeserializer,
      'deserialize',
      {
        default: (response: Response) => response.json() as Promise<R>,
      },
    );
  }

  async get(arg: T): Promise<R> {
    try {
      const response = await this.#httpOperator.perform(arg);
      return await this.#responseDeserializer(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Unable to obtain resource: ${errorMessage}`, {
        cause: error,
      });
    }
  }
}
