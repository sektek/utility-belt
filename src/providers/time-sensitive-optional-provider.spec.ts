import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { TimeSensitiveOptionalProvider } from './time-sensitive-optional-provider.js';

use(chaiAsPromised);

describe('TimeSensitiveOptionalProvider', function () {
  let provider: TimeSensitiveOptionalProvider<string, string>;

  beforeEach(function () {
    provider = new TimeSensitiveOptionalProvider({
      provider: async (key: string) => {
        if (key === 'valid') return 'Valid Value';
        return undefined;
      },
      timeout: 100,
    });
  });

  it('should return value from provider if available', async function () {
    const result = await provider.get('valid');
    expect(result).to.equal('Valid Value');
  });

  it('should return undefined if provider does not return a value within timeout', async function () {
    const result = await provider.get('invalid');
    expect(result).to.be.undefined;
  });

  it('should handle multiple calls with different keys', async function () {
    const validResult = await provider.get('valid');
    expect(validResult).to.equal('Valid Value');

    const invalidResult = await provider.get('invalid');
    expect(invalidResult).to.be.undefined;
  });

  it('should return undefined if provider times out', async function () {
    const slowProvider: TimeSensitiveOptionalProvider<string, string> =
      new TimeSensitiveOptionalProvider({
        provider: async () =>
          new Promise(resolve => setTimeout(() => resolve('Slow Value'), 100)),
        timeout: 50,
      });

    const result = await slowProvider.get('slow');
    expect(result).to.be.undefined;
  });
});
