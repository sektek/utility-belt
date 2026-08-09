import { expect } from 'chai';

import {
  firstArgumentKeyProvider,
  singleKeyProvider,
} from './key-providers.js';

describe('key providers', function () {
  describe('singleKeyProvider', function () {
    it('returns the same key regardless of arguments', function () {
      const a = singleKeyProvider({ args: [] });
      const b = singleKeyProvider({ args: ['x', 'y'] });
      expect(a).to.equal(b);
    });
  });

  describe('firstArgumentKeyProvider', function () {
    it('returns the first argument', function () {
      expect(firstArgumentKeyProvider({ args: ['a', 'b'] })).to.equal('a');
    });

    it('returns undefined for a call with no arguments', function () {
      const a = firstArgumentKeyProvider({ args: [] });
      const b = firstArgumentKeyProvider({ args: [] });
      expect(a).to.be.undefined;
      expect(a).to.equal(b);
    });
  });
});
