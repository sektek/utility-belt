import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { ProcessingProvider } from './processing-provider.js';

use(chaiAsPromised);

describe('ProcessingProvider', function () {
  it('should process data using the provided handlers', async function () {
    const provider = new ProcessingProvider<number>({
      provider: () => 5,
      processor: (input: number) => input * 2,
    });

    await expect(provider.provide()).to.eventually.equal(10);
  });

  it('should handle async provider and processor', async function () {
    const provider = new ProcessingProvider<number>({
      provider: async () => {
        return 5;
      },
      processor: async (input: number) => {
        return input * 3;
      },
    });

    await expect(provider.provide()).to.eventually.equal(15);
  });

  it('should pass context to the provider', async function () {
    const provider = new ProcessingProvider<number, number, { factor: number }>(
      {
        provider: context => {
          return 10 * context.factor;
        },
        processor: (input: number) => input + 5,
      },
    );

    await expect(provider.provide({ factor: 2 })).to.eventually.equal(25);
  });
});
