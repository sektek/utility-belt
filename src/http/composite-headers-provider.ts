import {
  HeadersProvider,
  HeadersProviderComponent,
  HeadersProviderFn,
} from './types/index.js';
import { getComponent } from '../get-component.js';

/** Options for the CompositeHeadersProvider constructor. */
export type CompositeHeadersProviderOptions<T = void> = {
  /** The headers providers to compose. */
  providers: HeadersProviderComponent<T> | HeadersProviderComponent<T>[];
};

/**
 * A HeadersProvider that composes multiple HeadersProviders into one.
 *
 * @template T The type of the argument passed to the headers providers.
 */
export class CompositeHeadersProvider<T = void> implements HeadersProvider<T> {
  #providers: HeadersProviderFn<T>[];

  constructor(opts: CompositeHeadersProviderOptions<T>) {
    this.#providers = [opts.providers]
      .flat()
      .map(provider => getComponent(provider, 'get'));
  }

  async get(arg: T): Promise<Headers> {
    const headers = new Headers();

    await Promise.all(
      this.#providers.map(async provider => {
        const providerHeaders = await provider(arg);
        if (!providerHeaders) {
          return;
        }

        if (providerHeaders instanceof Headers) {
          providerHeaders.forEach((value, name) => {
            headers.set(name, value);
          });
        } else if (Array.isArray(providerHeaders)) {
          providerHeaders.forEach(([name, value]) => {
            headers.set(name, value);
          });
        } else {
          Object.entries(providerHeaders).forEach(([name, value]) => {
            if (Array.isArray(value)) {
              value.forEach(v => headers.append(name, v));
              return;
            }
            headers.set(name, value as string);
          });
        }
      }),
    );

    return headers;
  }
}
