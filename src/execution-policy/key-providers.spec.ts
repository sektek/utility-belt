import {
  firstArgumentKeyProvider,
  singleKeyProvider,
} from './key-providers.js';
import { SharedExecutionKeyProviderFn } from './types.js';
import { expect } from 'chai';
import { getComponent } from '../get-component.js';

describe('key providers', function () {
  describe('singleKeyProvider', function () {
    it('returns the same key regardless of arguments', function () {
      const single: SharedExecutionKeyProviderFn = getComponent(
        singleKeyProvider,
        'get',
      );
      const a = single();
      const b = single('x', 'y');
      expect(a).to.equal(b);
    });
  });

  describe('firstArgumentKeyProvider', function () {
    it('returns the first argument', function () {
      const firstArgument: SharedExecutionKeyProviderFn = getComponent(
        firstArgumentKeyProvider,
        'get',
      );
      expect(firstArgument('a', 'b')).to.equal('a');
    });

    it('returns undefined for a call with no arguments', function () {
      const firstArgument: SharedExecutionKeyProviderFn = getComponent(
        firstArgumentKeyProvider,
        'get',
      );
      const a = firstArgument();
      const b = firstArgument();
      expect(a).to.be.undefined;
      expect(a).to.equal(b);
    });
  });
});
