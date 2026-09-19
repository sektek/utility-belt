import { expect } from 'chai';

import { ChainedProvider } from './chained-provider.js';

describe('ChainedProvider', function () {
  it('should return the value of the first provider that resolves a value', async function () {
    const provider = new ChainedProvider<string>({
      providers: [() => undefined, () => 'second'],
      defaultValue: 'fallback',
    });

    expect(await provider.get()).to.equal('second');
  });

  it('should fall back to defaultValue when all providers resolve undefined', async function () {
    const provider = new ChainedProvider<string>({
      providers: [() => undefined, () => undefined],
      defaultValue: 'fallback',
    });

    expect(await provider.get()).to.equal('fallback');
  });

  it('should fall back to defaultValueProvider when all providers resolve undefined', async function () {
    const provider = new ChainedProvider<string>({
      providers: [() => undefined],
      defaultValueProvider: () => 'fallback from provider',
    });

    expect(await provider.get()).to.equal('fallback from provider');
  });

  it('should throw an error if neither defaultValue nor defaultValueProvider is provided', function () {
    expect(
      () =>
        new ChainedProvider<string>({
          providers: [() => undefined],
        }),
    ).to.throw('Either defaultValue or defaultValueProvider must be provided.');
  });
});
