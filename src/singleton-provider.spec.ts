import { randomUUID } from 'crypto';

import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { SingletonProvider } from './singleton-provider.js';

use(chaiAsPromised);
use(sinonChai);

describe('SingletonProvider', function () {
  it('should return the same instance on multiple calls to get()', async function () {
    const provider = new SingletonProvider({
      provider: {
        get: async () => ({ value: randomUUID() }),
      },
    });

    const instance1 = await provider.get();
    const instance2 = await provider.get();

    expect(instance1).to.equal(instance2);
  });

  it('should call the provider function only once', async function () {
    const providerFn = sinon.fake.resolves({ value: randomUUID() });
    const provider = new SingletonProvider({
      provider: { get: providerFn },
    });

    await provider.get();
    await provider.get();

    expect(providerFn).to.have.been.calledOnce;
  });

  it('should handle concurrent calls to get()', async function () {
    const providerFn = sinon.fake.resolves({ value: randomUUID() });
    const provider = new SingletonProvider({
      provider: { get: providerFn },
    });

    const [instance1, instance2] = await Promise.all([
      provider.get(),
      provider.get(),
    ]);

    expect(instance1).to.equal(instance2);
    expect(providerFn).to.have.been.calledOnce;
  });

  it('should handle provider function that rejects', async function () {
    const error = new Error('Provider failed');
    const providerFn = sinon.fake.rejects(error);
    const provider = new SingletonProvider({
      provider: { get: providerFn },
    });

    await expect(provider.get()).to.be.rejectedWith(error);
    await expect(provider.get()).to.be.rejectedWith(error);

    expect(providerFn).to.have.been.calledTwice;
  });

  it('should handle falsy values returned by the provider function', async function () {
    const providerFn = sinon.fake.resolves(false);
    const provider = new SingletonProvider<boolean>({
      provider: { get: providerFn },
    });

    const instance1 = await provider.get();
    const instance2 = await provider.get();

    expect(instance1).to.equal(false);
    expect(instance1).to.equal(instance2);
    expect(providerFn).to.have.been.calledOnce;
  });
});
