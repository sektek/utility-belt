import { expect } from 'chai';

import { ObjectBuilder } from './object-builder.js';

describe('ObjectBuilder', function () {
  it('should build an object with the provided properties', function () {
    type TestObject = {
      name: string;
      age: number;
    };

    const builder = new ObjectBuilder<TestObject>();
    const result = builder.create({
      name: 'John Doe',
      age: 30,
    });
    expect(result).to.deep.equal({
      name: 'John Doe',
      age: 30,
    });
  });
});
