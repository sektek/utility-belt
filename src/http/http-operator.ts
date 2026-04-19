import { EventEmitter } from 'eventemitter3';

import {
  BodySerializerComponent,
  BodySerializerFn,
  HeadersProviderComponent,
  HeadersProviderFn,
  HttpEventService,
  UrlProviderComponent,
  UrlProviderFn,
} from './types/index.js';
import { CompositeHeadersProvider } from './composite-headers-provider.js';
import { contentTypeHeadersProvider } from './content-type-headers-provider.js';
import { getComponent } from '../get-component.js';

type HttpMethod = 'GET' | 'DELETE' | 'PATCH' | 'POST' | 'PUT';

/** Options for the HttpOperator constructor. */
export type HttpOperatorOptions<T = void> = {
  /** Provider for HTTP headers. */
  headersProvider?: HeadersProviderComponent<T>;
  /**
   * Provider for the URL to send the HTTP request to. If not provided, a
   * static URL must be provided with the `url` option.
   */
  urlProvider?: UrlProviderComponent<T>;
  /**
   * Serializer for the HTTP request body. If not provided, a default serializer
   * will be used based on the HTTP method.
   */
  bodySerializer?: BodySerializerComponent<T>;
  /** HTTP method to use for the request. Default is 'GET'. */
  method?: HttpMethod;
  /** Content-Type header value. Default is 'application/json'. */
  contentType?: string;
  /** Timeout for the HTTP request in milliseconds. */
  timeout?: number;
  /**
   * Static URL to send the HTTP request to. Ignored if `urlProvider` is provided.
   */
  url?: string;
};

const METHOD_DEFAULT_BODY_SERIALIZER: Record<HttpMethod, BodySerializerFn> = {
  DELETE: () => undefined,
  GET: () => undefined,
  PATCH: JSON.stringify,
  POST: JSON.stringify,
  PUT: JSON.stringify,
};

/**
 * HttpOperator is a class that performs HTTP requests using the Fetch API.
 */
export class HttpOperator<T = void>
  extends EventEmitter
  implements HttpEventService<T>
{
  #bodySerializer: BodySerializerFn<T>;
  #headersProvider: HeadersProviderFn<T>;
  #method: HttpMethod;
  #urlProvider: UrlProviderFn<T>;
  #timeout: number;

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

    this.#timeout = opts.timeout ?? 0;
  }

  async perform(arg: T): Promise<Response> {
    const request = new Request(await this.#urlProvider(arg), {
      method: this.#method,
      headers: await this.#headersProvider(arg),
      body: await this.#bodySerializer(arg),
      signal:
        this.#timeout > 0 ? AbortSignal.timeout(this.#timeout) : undefined,
    });
    this.emit('request:created', arg, request);

    let response: Response;
    try {
      response = await fetch(request);
    } catch (error) {
      this.emit('request:error', arg, request, error);
      throw error;
    }

    if (response.status < 200 || response.status >= 300) {
      const error = new Error(`Unexpected status code: ${response.status}`);
      this.emit('response:error', arg, response, error);
      throw error;
    }

    this.emit('response:received', arg, response);

    return response;
  }
}
