import { expect } from 'chai';

import { ArrayCollection } from './array-collection.js';

describe('ArrayCollection', function () {
  let collection: ArrayCollection<number>;

  beforeEach(function () {
    collection = new ArrayCollection<number>();
  });

  it('should add items to the collection', function () {
    collection.add(1);
    collection.add(2);

    expect(Array.from(collection.values())).to.deep.equal([1, 2]);
  });

  it('should clear the collection', function () {
    collection.add(1);
    collection.add(2);
    collection.clear();

    expect(Array.from(collection.values())).to.deep.equal([]);
  });
});
