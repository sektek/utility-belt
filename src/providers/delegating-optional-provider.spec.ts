import { expect } from 'chai';

import { DelegatingOptionalProvider } from './delegating-optional-provider.js';

describe('DelegatingOptionalProvider', function () {
  it('should delegate to the provider matching the selected key', async function () {
    const provider = new DelegatingOptionalProvider<string, number>({
      selector: (value: number) => (value % 2 === 0 ? 'even' : 'odd'),
      delegates: {
        even: () => 'even',
        odd: () => 'odd',
      },
    });

    expect(await provider.get(2)).to.equal('even');
    expect(await provider.get(3)).to.equal('odd');
  });

  it('should fall back to the default delegate when the key is not found', async function () {
    const provider = new DelegatingOptionalProvider<string>({
      selector: () => 'unknown',
      delegates: {
        known: () => 'known',
      },
      default: () => 'default',
    });

    expect(await provider.get()).to.equal('default');
  });

  it('should resolve to undefined when the key is not found and no default is given', async function () {
    const provider = new DelegatingOptionalProvider<string>({
      selector: () => 'unknown',
      delegates: {
        known: () => 'known',
      },
    });

    expect(await provider.get()).to.be.undefined;
  });

  it('should fall back to the default delegate when the selector returns undefined', async function () {
    const provider = new DelegatingOptionalProvider<string>({
      selector: () => undefined,
      delegates: {
        known: () => 'known',
      },
      default: () => 'default',
    });

    expect(await provider.get()).to.equal('default');
  });

  it('should resolve to undefined when the selector returns undefined and no default is given', async function () {
    const provider = new DelegatingOptionalProvider<string>({
      selector: () => undefined,
      delegates: {
        known: () => 'known',
      },
    });

    expect(await provider.get()).to.be.undefined;
  });

  it('should support component style selectors, delegates, and default', async function () {
    const provider = new DelegatingOptionalProvider<string>({
      selector: { get: () => 'known' },
      delegates: {
        known: { get: () => 'known' },
      },
      default: { get: () => 'default' },
    });

    expect(await provider.get()).to.equal('known');
  });

  it('should support an asynchronous selector', async function () {
    const provider = new DelegatingOptionalProvider<string>({
      selector: async () => 'known',
      delegates: {
        known: () => 'known',
      },
    });

    expect(await provider.get()).to.equal('known');
  });
});
