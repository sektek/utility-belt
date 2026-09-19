import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { DelegatingProvider } from './delegating-provider.js';

use(chaiAsPromised);

describe('DelegatingProvider', function () {
  it('should delegate to the provider matching the selected key', async function () {
    const provider = new DelegatingProvider<string, number>({
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
    const provider = new DelegatingProvider<string>({
      selector: () => 'unknown',
      delegates: {
        known: () => 'known',
      },
      default: () => 'default',
    });

    expect(await provider.get()).to.equal('default');
  });

  it('should throw when the key is not found and no default is given', async function () {
    const provider = new DelegatingProvider<string>({
      selector: () => 'unknown',
      delegates: {
        known: () => 'known',
      },
    });

    await expect(provider.get()).to.be.rejectedWith(
      'No provider delegate found for key: unknown',
    );
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

  it('should throw when the selector returns undefined and no default is given', async function () {
    const provider = new DelegatingProvider<string>({
      selector: () => undefined,
      delegates: {
        known: () => 'known',
      },
    });

    await expect(provider.get()).to.be.rejectedWith(
      'No provider delegate found for an undefined key.',
    );
  });

  it('should support component style selectors and delegates', async function () {
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
    });

    expect(await provider.get()).to.equal('known');
  });
});
