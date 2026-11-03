import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { NotFoundHandlingProvider } from './not-found-handling-provider.js';
import { ResourceNotFoundError } from '../errors/index.js';

use(chaiAsPromised);

describe('NotFoundHandlingProvider', function () {
  it('returns the value from the wrapped provider', async function () {
    const provider = new NotFoundHandlingProvider({
      provider: { get: async (id: string) => `value-${id}` },
    });

    expect(await provider.get('a')).to.equal('value-a');
  });

  it('returns undefined when the provider throws ResourceNotFoundError', async function () {
    const provider = new NotFoundHandlingProvider({
      provider: (id: string): string => {
        throw new ResourceNotFoundError({ resource: 'Thing', id });
      },
    });

    expect(await provider.get('a')).to.be.undefined;
  });

  it('returns undefined when the provider rejects with ResourceNotFoundError', async function () {
    const provider = new NotFoundHandlingProvider({
      provider: async (): Promise<string> => {
        throw new ResourceNotFoundError();
      },
    });

    expect(await provider.get()).to.be.undefined;
  });

  it('rethrows other errors', async function () {
    const error = new Error('boom');
    const provider = new NotFoundHandlingProvider({
      provider: async (): Promise<string> => {
        throw error;
      },
    });

    await expect(provider.get()).to.be.rejectedWith(error);
  });

  it('passes the argument to the wrapped provider', async function () {
    const received: string[] = [];
    const provider = new NotFoundHandlingProvider({
      provider: (id: string) => {
        received.push(id);

        return id;
      },
    });

    await provider.get('x');

    expect(received).to.deep.equal(['x']);
  });
});
