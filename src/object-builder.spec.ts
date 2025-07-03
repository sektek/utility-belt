import { expect } from 'chai';

import { ObjectBuilder } from './object-builder.js';

describe('ObjectBuilder', function () {
  it('should build an object with the provided properties', async function () {
    type TestObject = {
      name: string;
      age: number;
    };

    const builder = new ObjectBuilder<TestObject>();
    const result = await builder.create({
      name: 'John Doe',
      age: 30,
    });
    expect(result).to.deep.equal({
      name: 'John Doe',
      age: 30,
    });
  });

  it('should allow properties to be set for default values', async function () {
    type TestObject = {
      name: string;
      age: number;
    };

    const builder = new ObjectBuilder<TestObject>({
      defaults: {
        age: 30,
      },
    });
    const result = await builder.create({
      name: 'Jane Doe',
    });
    expect(result).to.deep.equal({
      name: 'Jane Doe',
      age: 30,
    });
  });

  it('should allow properties to be set for default values with a function', async function () {
    type TestObject = {
      name: string;
      age: number;
    };

    const builder = new ObjectBuilder<TestObject>({
      defaults: {
        age: () => 30,
      },
    });
    const result = await builder.create({
      name: 'Jane Doe',
    });
    expect(result).to.deep.equal({
      name: 'Jane Doe',
      age: 30,
    });
  });

  it('should allow properties to be overridden with a function', async function () {
    type TestObject = {
      name: string;
      age: number;
    };

    const builder = new ObjectBuilder<TestObject>({
      defaults: {
        age: 30,
      },
    });
    const result = await builder.create({
      name: 'Jane Doe',
      age: () => 25,
    });
    expect(result).to.deep.equal({
      name: 'Jane Doe',
      age: 25,
    });
  });

  it('should allow properties to be set for default values with a function that returns a promise', async function () {
    type TestObject = {
      name: string;
      age: number;
    };

    const builder = new ObjectBuilder<TestObject>({
      defaults: {
        age: async () => 30,
      },
    });
    const result = await builder.create({
      name: 'Jane Doe',
    });
    expect(result).to.deep.equal({
      name: 'Jane Doe',
      age: 30,
    });
  });

  it('should allow properties to be overridden with a function that returns a promise', async function () {
    type TestObject = {
      name: string;
      age: number;
    };

    const builder = new ObjectBuilder<TestObject>({
      defaults: {
        age: 30,
      },
    });
    const result = await builder.create({
      name: 'Jane Doe',
      age: async () => 25,
    });
    expect(result).to.deep.equal({
      name: 'Jane Doe',
      age: 25,
    });
  });

  it('should allow defaults to be set for properties that are provided as object overrides', async function () {
    type Address = {
      street: string;
      city: string;
    };
    type TestObject = {
      name: string;
      age: number;
      address: Address;
    };

    const addressBuilder = new ObjectBuilder<Address>({
      defaults: {
        street: '123 Main St',
        city: 'Anytown',
      },
    });

    const builder = new ObjectBuilder<TestObject>({
      defaults: {
        age: 30,
        address: addressBuilder.creator,
      },
    });
    const result = await builder.create({
      name: 'Jane Doe',
      address: { street: '456 Elm St' },
    });
    expect(result).to.deep.equal({
      name: 'Jane Doe',
      age: 30,
      address: { street: '456 Elm St', city: 'Anytown' },
    });
  });
});
