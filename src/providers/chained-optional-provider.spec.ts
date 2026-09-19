import { expect, use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { ChainedOptionalProvider } from './chained-optional-provider.js';

use(sinonChai);

describe('ChainedOptionalProvider', function () {
  it('should return the value of the first provider that resolves a value', async function () {
    const provider = new ChainedOptionalProvider<string>({
      providers: [() => undefined, () => 'second', () => 'third'],
    });

    expect(await provider.get()).to.equal('second');
  });

  it('should not query providers after one resolves a value', async function () {
    const first = sinon.fake.returns(undefined);
    const second = sinon.fake.returns('second');
    const third = sinon.fake.returns('third');

    const provider = new ChainedOptionalProvider<string>({
      providers: [first, second, third],
    });

    await provider.get();

    expect(first).to.have.been.calledOnce;
    expect(second).to.have.been.calledOnce;
    expect(third).to.not.have.been.called;
  });

  it('should return undefined if all providers resolve undefined', async function () {
    const provider = new ChainedOptionalProvider<string>({
      providers: [() => undefined, () => undefined],
    });

    expect(await provider.get()).to.be.undefined;
  });

  it('should return undefined if no providers are given', async function () {
    const provider = new ChainedOptionalProvider<string>({
      providers: [],
    });

    expect(await provider.get()).to.be.undefined;
  });

  it('should support provider components with a get method', async function () {
    const provider = new ChainedOptionalProvider<string>({
      providers: [{ get: () => undefined }, { get: () => 'from component' }],
    });

    expect(await provider.get()).to.equal('from component');
  });

  it('should support asynchronous providers', async function () {
    const provider = new ChainedOptionalProvider<string>({
      providers: [async () => undefined, async () => 'async value'],
    });

    expect(await provider.get()).to.equal('async value');
  });
});
