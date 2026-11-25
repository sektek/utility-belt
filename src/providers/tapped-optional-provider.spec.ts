import { expect } from 'chai';

import { TappedOptionalProvider } from './tapped-optional-provider.js';

describe('TappedOptionalProvider', function () {
  it('should call the handler with the context before the provider', async function () {
    const calls: string[] = [];
    const provider = new TappedOptionalProvider<string, number>({
      handler: (value: number) => {
        calls.push(`handler:${value}`);
      },
      provider: (value: number) => {
        calls.push(`provider:${value}`);
        return 'result';
      },
    });

    await provider.get(5);

    expect(calls).to.deep.equal(['handler:5', 'provider:5']);
  });

  it('should return the provider value unchanged', async function () {
    const value = { id: 1 };
    const provider = new TappedOptionalProvider<object>({
      handler: () => 'ignored',
      provider: () => value,
    });

    expect(await provider.get()).to.equal(value);
  });

  it('should run the handler and return undefined when the provider returns undefined', async function () {
    let handled = 0;
    const provider = new TappedOptionalProvider<string>({
      handler: () => {
        handled++;
      },
      provider: () => undefined,
    });

    expect(await provider.get()).to.be.undefined;
    expect(handled).to.equal(1);
  });

  it('should pass the same context to the handler and the provider', async function () {
    const context = { key: 'value' };
    const received: unknown[] = [];
    const provider = new TappedOptionalProvider<string, typeof context>({
      handler: (ctx: typeof context) => {
        received.push(ctx);
      },
      provider: (ctx: typeof context) => {
        received.push(ctx);
        return 'result';
      },
    });

    await provider.get(context);

    expect(received).to.have.length(2);
    expect(received[0]).to.equal(context);
    expect(received[1]).to.equal(context);
  });

  it('should await an asynchronous handler before calling the provider', async function () {
    const calls: string[] = [];
    const provider = new TappedOptionalProvider<string>({
      handler: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        calls.push('handler');
      },
      provider: () => {
        calls.push('provider');
        return 'result';
      },
    });

    await provider.get();

    expect(calls).to.deep.equal(['handler', 'provider']);
  });

  it('should propagate handler errors without calling the provider', async function () {
    const error = new Error('handler failed');
    let providerCalls = 0;
    const provider = new TappedOptionalProvider<string>({
      handler: async () => {
        throw error;
      },
      provider: () => {
        providerCalls++;
        return 'result';
      },
    });

    let caught: unknown;
    try {
      await provider.get();
    } catch (e) {
      caught = e;
    }

    expect(caught).to.equal(error);
    expect(providerCalls).to.equal(0);
  });

  it('should propagate provider errors', async function () {
    const error = new Error('provider failed');
    const provider = new TappedOptionalProvider<string>({
      handler: () => undefined,
      provider: async () => {
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

  it('should support class instance style provider and handler', async function () {
    const calls: string[] = [];
    const provider = new TappedOptionalProvider<string, string>({
      handler: {
        execute: (value: string) => {
          calls.push(`handler:${value}`);
        },
      },
      provider: {
        get: (value: string) => {
          calls.push(`provider:${value}`);
          return `got ${value}`;
        },
      },
    });

    expect(await provider.get('x')).to.equal('got x');
    expect(calls).to.deep.equal(['handler:x', 'provider:x']);
  });
});
