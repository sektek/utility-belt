import { expect } from 'chai';

import { DelegatingProvider } from './delegating-provider.js';

describe('DelegatingProvider', function () {
  it('should delegate to the provider matching the selected key', async function () {
    const provider = new DelegatingProvider<string, number>({
      selector: (value: number) => (value % 2 === 0 ? 'even' : 'odd'),
      delegates: {
        even: () => 'even',
        odd: () => 'odd',
      },
      default: () => 'default',
    });

    expect(await provider.get(2)).to.equal('even');
    expect(await provider.get(3)).to.equal('odd');
  });

  it('should fall back to the default delegate when the key is not found', async function () {
    const provider = new DelegatingProvider<string>({
      selector: () => 'unknown',
      delegates: {
        known: () => 'known',
      },
      default: () => 'default',
    });

    expect(await provider.get()).to.equal('default');
  });

  it('should fall back to the default delegate when the selector returns undefined', async function () {
    const provider = new DelegatingProvider<string>({
      selector: () => undefined,
      delegates: {
        known: () => 'known',
      },
      default: () => 'default',
    });

    expect(await provider.get()).to.equal('default');
  });

  it('should support component style selectors, delegates, and default', async function () {
    const provider = new DelegatingProvider<string>({
      selector: { get: () => 'known' },
      delegates: {
        known: { get: () => 'known' },
      },
      default: { get: () => 'default' },
    });

    expect(await provider.get()).to.equal('known');
  });

  it('should support an asynchronous selector', async function () {
    const provider = new DelegatingProvider<string>({
      selector: async () => 'known',
      delegates: {
        known: () => 'known',
      },
      default: () => 'default',
    });

    expect(await provider.get()).to.equal('known');
  });
});
