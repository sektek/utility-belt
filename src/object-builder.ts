import _ from 'lodash';

import { Builder, BuilderOptions } from './types/builder.js';

export type ObjectBuilderOptions<T extends object = Record<string, unknown>> = {
  defaults?: Partial<BuilderOptions<T>>;
  copyKeys?: (keyof T)[];
};

export class ObjectBuilder<T extends object> implements Builder<T> {
  #defaults: Partial<BuilderOptions<T>>;
  #copyKeys: (keyof T)[];

  constructor(opts: ObjectBuilderOptions<T> = {}) {
    this.#defaults = opts.defaults ?? {};
    this.#copyKeys = opts.copyKeys ?? [];
  }

  with(defaults: Partial<BuilderOptions<T>> = {}): ObjectBuilder<T> {
    return new ObjectBuilder({
      defaults: { ...this.#defaults, ...defaults },
      copyKeys: this.#copyKeys,
    });
  }

  async create(overrides: Partial<BuilderOptions<T>> = {}): Promise<T> {
    const result: Record<string, unknown> = {};
    await Promise.all(
      Object.keys({ ...this.#defaults, ...overrides }).map(async key => {
        result[key] = _.cloneDeep(
          await this.#renderValue(key, this.#defaults[key], overrides[key]),
        );
      }),
    );

    return result as T;
  }

  async #renderValue(
    key: string,
    value: unknown,
    override: unknown,
  ): Promise<unknown> {
    if (override instanceof Function) {
      return await override();
    }
    if (value instanceof Function) {
      override ??= {};
      if (override instanceof Object) {
        return await value(override);
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
}
