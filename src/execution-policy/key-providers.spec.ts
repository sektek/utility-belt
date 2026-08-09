import {
  firstArgumentKeyProvider,
  singleKeyProvider,
} from './key-providers.js';
import { ProviderFn } from '../types/provider.js';
import { SharedExecutionContext } from './types.js';
import { expect } from 'chai';
import { getComponent } from '../get-component.js';

describe('key providers', function () {
  describe('singleKeyProvider', function () {
    it('returns the same key regardless of arguments', function () {
      const single: ProviderFn<unknown, SharedExecutionContext> = getComponent(
        singleKeyProvider,
        'get',
      );
      const a = single({ args: [] });
      const b = single({ args: ['x', 'y'] });
      expect(a).to.equal(b);
    });
  });

  describe('firstArgumentKeyProvider', function () {
    it('returns the first argument', function () {
      const firstArgument: ProviderFn<unknown, SharedExecutionContext> =
        getComponent(firstArgumentKeyProvider, 'get');
      expect(firstArgument({ args: ['a', 'b'] })).to.equal('a');
    });

    it('returns undefined for a call with no arguments', function () {
      const firstArgument: ProviderFn<unknown, SharedExecutionContext> =
        getComponent(firstArgumentKeyProvider, 'get');
      const a = firstArgument({ args: [] });
      const b = firstArgument({ args: [] });
      expect(a).to.be.undefined;
      expect(a).to.equal(b);
    });
  });
});
