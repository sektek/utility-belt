import { expect } from 'chai';

import { ConditionalProvider } from './conditional-provider.js';

describe('ConditionalProvider', function () {
  it('should return the provider value when the predicate is true', async function () {
    const provider = new ConditionalProvider<string, string>({
      provider: () => 'value',
      predicate: () => true,
    });

    expect(await provider.get('ctx')).to.equal('value');
  });

  it('should return undefined without calling the provider when the predicate is false', async function () {
    let calls = 0;
    const provider = new ConditionalProvider<string, string>({
      provider: () => {
        calls++;
        return 'value';
      },
      predicate: () => false,
    });

    expect(await provider.get('ctx')).to.be.undefined;
    expect(calls).to.equal(0);
  });

  it('should return undefined when the provider does and the predicate is true', async function () {
    const provider = new ConditionalProvider<string, string>({
      provider: () => undefined,
      predicate: () => true,
    });

    expect(await provider.get('ctx')).to.be.undefined;
  });

  it('should pass the context to the predicate and the provider', async function () {
    const predicateArgs: string[] = [];
    const providerArgs: string[] = [];
    const provider = new ConditionalProvider<string, string>({
      provider: (ctx: string) => {
        providerArgs.push(ctx);
        return ctx.toUpperCase();
      },
      predicate: (ctx: string) => {
        predicateArgs.push(ctx);
        return true;
      },
    });

    expect(await provider.get('abc')).to.equal('ABC');
    expect(predicateArgs).to.deep.equal(['abc']);
    expect(providerArgs).to.deep.equal(['abc']);
  });

  it('should support class instances for the provider and predicate', async function () {
    const provider = new ConditionalProvider<string, number>({
      provider: { get: (n: number) => `n=${n}` },
      predicate: { test: (n: number) => n > 1 },
    });

    expect(await provider.get(2)).to.equal('n=2');
    expect(await provider.get(1)).to.be.undefined;
  });

  it('should support asynchronous providers and predicates', async function () {
    const provider = new ConditionalProvider<string, number>({
      provider: async (n: number) => `n=${n}`,
      predicate: async (n: number) => n > 1,
    });

    expect(await provider.get(2)).to.equal('n=2');
    expect(await provider.get(1)).to.be.undefined;
  });

  it('should accept a plain provider that never returns undefined', async function () {
    const plain: { get(): string } = { get: () => 'always' };
    const provider = new ConditionalProvider<string>({
      provider: plain,
      predicate: () => true,
    });

    expect(await provider.get()).to.equal('always');
  });

  it('should propagate predicate errors', async function () {
    const error = new Error('predicate failed');
    const provider = new ConditionalProvider<string>({
      provider: () => 'value',
      predicate: () => {
        throw error;
      },
    });

    let caught: unknown;
    try {
      await provider.get();
    } catch (e) {
      caught = e;
    }

    expect(caught).to.equal(error);
  });

  it('should propagate provider errors', async function () {
    const error = new Error('provider failed');
    const provider = new ConditionalProvider<string>({
      provider: () => {
        throw error;
      },
      predicate: () => true,
    });

    let caught: unknown;
    try {
      await provider.get();
    } catch (e) {
      caught = e;
    }

    expect(caught).to.equal(error);
  });
});
