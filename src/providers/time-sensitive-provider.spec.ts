import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { TimeSensitiveProvider } from './time-sensitive-provider.js';

use(chaiAsPromised);

describe('TimeSensitiveProvider', function () {
  let provider: TimeSensitiveProvider<string, string>;

  beforeEach(function () {
    provider = new TimeSensitiveProvider({
      provider: async (key: string) => {
        if (key === 'valid') return 'Valid Value';
        return 'Default Value';
      },
      timeout: 100,
    });
  });

  it('should return value from provider if available', async function () {
    const result = await provider.get('valid');
    expect(result).to.equal('Valid Value');
  });

  it('should throw an error if provider does not return a value within timeout', async function () {
    const result = await provider.get('invalid');
    expect(result).to.equal('Default Value');
  });

  it('should handle multiple calls with different keys', async function () {
    const validResult = await provider.get('valid');
    expect(validResult).to.equal('Valid Value');

    const invalidResult = await provider.get('invalid');
    expect(invalidResult).to.equal('Default Value');
  });

  it('should throw an error if provider times out', async function () {
    const slowProvider: TimeSensitiveProvider<string, string> =
      new TimeSensitiveProvider({
        provider: async () =>
          new Promise(resolve => setTimeout(() => resolve('Slow Value'), 100)),
        timeout: 50,
      });

    await expect(slowProvider.get('slow')).to.be.rejectedWith(
      'Provider timed out',
    );
  });
});
