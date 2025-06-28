import { OptionalProvider } from '../types/optional-provider.js';
import { getComponent } from '../get-component.js';

import { HttpOperator } from './http-operator.js';
import { HttpProviderOptions } from './http-provider.js';
import { ResponseDeserializerFn } from './types/response-deserializer.js';

export class HttpOptionalProvider<R, T = unknown>
  implements OptionalProvider<R, T>
{
  #httpOperator: HttpOperator<T>;
  #responseDeserializer: ResponseDeserializerFn<R>;

  constructor(opts: HttpProviderOptions<R, T>) {
    if (!opts.httpOperator && !opts.url && !opts.urlProvider) {
      throw new Error(
        'HttpOptionalProvider requires either an httpOperator, url, or urlProvider to be provided.',
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

  async get(arg: T): Promise<R | undefined> {
    let response: Response;

    try {
      response = await this.#httpOperator.perform(arg);
    } catch {
      return undefined;
    }

    try {
      return await this.#responseDeserializer(response);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to deserialize resource: ${errorMessage}`, {
        cause: error,
      });
    }
  }
}
