import { randomUUID } from 'crypto';

import _ from 'lodash';

import { Provider, ProviderFn } from './types/provider.js';
import { isFunction } from './is-function.js';

export type BuilderFn<T> = ProviderFn<T, Partial<BuilderOptions<T>>>;

export interface Builder<T> extends Provider<T> {
  create: BuilderFn<T>;
}

/**
 * A type that represents a set of options for a builder.
 * It iterates over the keys (type P) of the type T and allows for
 * each key to be either a value of type T[P] or a provider function
 * that returns a value of type T.
 *
 * @typeParam T - The type of the object intended to be built.
 */
export type BuilderOptions<T> = {
  [P in keyof T]?:
    | T[P]
    | ProviderFn<T[P], Partial<BuilderOptions<T[P]>>>
    | BuilderOptions<T[P]>;
} & {
  [key: string]: unknown;
};

export const builderRender = async <T>(
  data: BuilderOptions<T>,
): Promise<Partial<T>> => {
  const result: Record<string, unknown> = {};

  for (const key in data) {
    if (data?.[key] !== undefined) {
      result[key] = isFunction(data?.[key]) ? await data[key]() : data?.[key];
    }
  }

  return result as Partial<T>;
};

export type AbstractBuilderOptions<T> = {
  defaults?: Partial<BuilderOptions<T>>;
  copyKeys?: (keyof BuilderOptions<T>)[];
};

export class AbstractBuilder<T extends object = Record<string, unknown>> {
  #defaults: Partial<BuilderOptions<T>>;
  #copyKeys;

  constructor(opts: AbstractBuilderOptions<T> = {}) {
    this.#defaults = opts.defaults ?? {};
    this.#copyKeys = opts.copyKeys ?? [];
  }

  with(defaults: Partial<BuilderOptions<T>> = {}) {
    return new AbstractBuilder({
      defaults: { ...this.#defaults, ...defaults },
      copyKeys: this.#copyKeys,
    });
  }

  from(obj: T) {
    const defaults: Partial<BuilderOptions<T>> =
      this.#copyKeys.length > 0
        ? (_.pick(obj, this.#copyKeys) as Partial<BuilderOptions<T>>)
        : (obj as Partial<BuilderOptions<T>>);
    return this.with(defaults);
  }

  create(overrides: Partial<BuilderOptions<T>> = {}): T {
    const result: Record<string, unknown> = {};
    Object.keys({ ...this.#defaults, ...overrides }).forEach(key => {
      result[key] = _.cloneDeep(
        this.#renderValue(key, this.#defaults[key], overrides[key]),
      );
    });

    return result as T;
  }

  #renderValue(key: string, value: unknown, override: unknown) {
    if (override instanceof Function) {
      return override();
    }
    if (value instanceof Function) {
      override ??= {};
      if (override instanceof Object) {
        return value(override);
      }
      throw new Error(
        `${key} can only accept an object as override. Provided: ${override}`,
      );
    }
    if (value instanceof Object && override instanceof Object) {
      return _.merge({}, value, override);
    }

    return override ?? value;
  }

  get creator() {
    return this.create.bind(this);
  }
}

type Address = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

type Person = {
  id: string;
  name: string;
  age: number;
  address: Address;
};

const randomInt = (min = 1, max = 1000): number => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const addressBuilder = new AbstractBuilder<Address>({
  defaults: {
    street: () => `${randomInt()} Main St`,
    city: 'Anytown',
    state: 'CA',
    zip: '12345',
  },
});

const builder = new AbstractBuilder<Person>({
  defaults: {
    id: () => randomUUID(),
    age: 30,
    address: addressBuilder.creator,
  },
});

const instance = builder
  .with({ age: () => randomInt(20, 40) })
  .create({ name: 'John Doe', address: { state: 'WA' } });
console.log(instance); // { id: '...', name: 'John Doe', age: 25 }
