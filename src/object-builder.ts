import _ from 'lodash';

import { Builder, BuilderOptions } from './types/builder.js';

/**
 * Options for the ObjectBuilder.
 *
 * @template T The type of object to build. Defaults to Record<string, unknown>.
 * @property {Partial<BuilderOptions<T>>} [defaults] - Default values for the
 * object properties. These can be functions that return values or
 * static values.
 * @property {Array<keyof T>} [copyKeys] - Keys to copy from the input
 * object when calling `from()`. This allows for selective copying of
 * properties from an existing object to the builder's defaults.
 * If not provided, no keys are copied.
 */
export type ObjectBuilderOptions<T extends object = Record<string, unknown>> = {
  defaults?: Partial<BuilderOptions<T>>;
  copyKeys?: Array<keyof T>;
};

/**
 * A builder for creating objects with specified properties and default values.
 * This class allows you to define default values for object properties,
 * as well as copy existing properties from another object.
 * It supports both static values and functions that return values,
 * enabling dynamic object creation.
 *
 * @template T The type of object to build.
 */
export class ObjectBuilder<T extends object> implements Builder<T> {
  #defaults: Partial<BuilderOptions<T>>;
  #copyKeys: Array<keyof T>;

  /**
   * Creates an instance of ObjectBuilder.
   *
   * @param {ObjectBuilderOptions<T>} [opts] - Options for the builder.
   * @property {Partial<BuilderOptions<T>>} [opts.defaults] - Default values
   * for the object properties.
   * @property {Array<keyof T>} [opts.copyKeys] - Keys to copy from an
   * existing object when calling `from()`.
   */
  constructor(opts: ObjectBuilderOptions<T> = {}) {
    this.#defaults = opts.defaults ?? {};
    this.#copyKeys = opts.copyKeys ?? [];
  }

  /**
   * Creates a new ObjectBuilder from an existing object.
   * The new builder will have the defaults merged with the properties
   * of the provided object, allowing for selective copying of properties.
   *
   * @param {unknown} object - The object to copy properties from.
   * @returns {ObjectBuilder<T>} A new ObjectBuilder instance with the
   * copied properties.
   */
  from(object: unknown): ObjectBuilder<T> {
    if (!(typeof object === 'object' && object !== null)) {
      throw new Error(
        `ObjectBuilder.from() expects an object, received: ${object}`,
      );
    }
    return new ObjectBuilder({
      defaults: { ...this.#defaults, ..._.pick(object, this.#copyKeys) },
      copyKeys: this.#copyKeys,
    });
  }

  /**
   * Creates a new ObjectBuilder with additional defaults.
   * This allows for extending the existing defaults with new values.
   *
   * @param {Partial<BuilderOptions<T>>} [defaults] - Additional default values
   * to merge with the existing defaults.
   * @returns {ObjectBuilder<T>} A new ObjectBuilder instance with the
   * merged defaults.
   */
  with(defaults: Partial<BuilderOptions<T>> = {}): ObjectBuilder<T> {
    return new ObjectBuilder({
      defaults: { ...this.#defaults, ...defaults },
      copyKeys: this.#copyKeys,
    });
  }

  /**
   * Creates an object with the specified properties and default values.
   * The properties can be overridden by providing an object with the same
   * keys. If a value is a function, it will be called with the override
   * object as an argument.
   *
   * @param {Partial<BuilderOptions<T>>} [overrides] - Properties to override
   * the defaults. If a property is a function, it will be called with the
   * overrides as an argument.
   * @returns {Promise<T>} A promise that resolves to the created object.
   */
  async create(overrides: Partial<BuilderOptions<T>> = {}): Promise<T> {
    const result: Record<string, unknown> = {};
    await Promise.all(
      (
        Object.keys({ ...this.#defaults, ...overrides }) as Array<
          keyof BuilderOptions<T>
        >
      ).map(async key => {
        result[key as string] = _.cloneDeep(
          await this.#renderValue(
            key as string,
            this.#defaults[key],
            overrides[key],
          ),
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

  /**
   * Gets the creator function for the builder.
   * @returns {(overrides: Partial<BuilderOptions<T>>) => Promise<T>} The creator function.
   */
  get creator() {
    return this.create.bind(this);
  }
}
