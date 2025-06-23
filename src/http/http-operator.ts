import { EventEmitter } from 'events';

import { getComponent } from '../get-component.js';

import { CompositeHeadersProvider } from './composite-headers-provider.js';
import { contentTypeHeadersProvider } from './content-type-headers-provider.js';

import {
  BodySerializerComponent,
  BodySerializerFn,
  HeadersProviderComponent,
  HeadersProviderFn,
  HttpEventService,
  UrlProviderComponent,
  UrlProviderFn,
} from './types/index.js';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type HttpOperatorOptions<T> = {
  headersProvider?: HeadersProviderComponent<T>;
  urlProvider?: UrlProviderComponent<T>;
  bodySerializer?: BodySerializerComponent<T>;
  method?: HttpMethod;
  contentType?: string;
  url?: string;
};

const METHOD_DEFAULT_BODY_SERIALIZER: Record<HttpMethod, BodySerializerFn> = {
  GET: () => undefined,
  POST: JSON.stringify,
  PUT: JSON.stringify,
  DELETE: () => undefined,
};

export class HttpOperator<T>
  extends EventEmitter
  implements HttpEventService<T>
{
  #bodySerializer: BodySerializerFn<T>;
  #headersProvider: HeadersProviderFn<T>;
  #method: HttpMethod;
  #urlProvider: UrlProviderFn<T>;

  constructor(opts: HttpOperatorOptions<T>) {
    super();

    if (!opts.urlProvider && !opts.url) {
      throw new Error('Must provide either urlProvider or url');
    }
    this.#urlProvider = getComponent(opts.urlProvider, 'get', {
      default: () => opts.url!,
    });

    this.#method = opts.method ?? 'GET';
    this.#bodySerializer = getComponent(opts.bodySerializer, 'serialize', {
      name: 'bodySerializer',
      default: METHOD_DEFAULT_BODY_SERIALIZER[this.#method],
    });

    const contentType = opts.contentType ?? 'application/json';
    if (opts.headersProvider && opts.contentType) {
      this.#headersProvider = getComponent(
        new CompositeHeadersProvider<T>({
          providers: [
            getComponent(opts.headersProvider, 'get', {
              name: 'headersProvider',
            }),
            contentTypeHeadersProvider(contentType),
          ],
        }) as HeadersProviderComponent<T>,
        'get',
      );
    } else {
      this.#headersProvider = getComponent(opts.headersProvider, 'get', {
        name: 'headersProvider',
        defaultProvider: () => contentTypeHeadersProvider(contentType),
      });
    }
  }

  async perform(arg: T): Promise<Response> {
    const request = new Request(await this.#urlProvider(arg), {
      method: this.#method,
      headers: await this.#headersProvider(arg),
      body: await this.#bodySerializer(arg),
    });
    this.emit('request:created', arg, request);

    const response = await fetch(request);

    if (response.status < 200 || response.status >= 300) {
      const error = new Error(`Unexpected status code: ${response.status}`);
      this.emit('response:error', arg, response, error);
      throw error;
    }

    this.emit('response:received', arg, response);

    return response;
  }
}
