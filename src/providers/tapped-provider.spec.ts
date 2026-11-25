import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { TappedProvider } from './tapped-provider.js';

use(chaiAsPromised);

describe('TappedProvider', function () {
  it('should call the handler before the provider', async function () {
    const calls: string[] = [];
    const provider = new TappedProvider<string, string>({
      handler: () => {
        calls.push('handler');
      },
      provider: () => {
        calls.push('provider');
        return 'value';
      },
    });

    await provider.get('ctx');

    expect(calls).to.deep.equal(['handler', 'provider']);
  });

  it('should return the provider value unchanged', async function () {
    const value = { a: 1 };
    const provider = new TappedProvider<object, string>({
      handler: () => 'ignored',
      provider: () => value,
    });

    expect(await provider.get('ctx')).to.equal(value);
  });

  it('should pass the same context to the handler and provider', async function () {
    const context = { id: 1 };
    const received: unknown[] = [];
    const provider = new TappedProvider<string, { id: number }>({
      handler: ctx => {
        received.push(ctx);
      },
      provider: ctx => {
        received.push(ctx);
        return 'value';
      },
    });

    await provider.get(context);

    expect(received).to.have.length(2);
    expect(received[0]).to.equal(context);
    expect(received[1]).to.equal(context);
  });

  it('should await an async handler before calling the provider', async function () {
    const calls: string[] = [];
    const provider = new TappedProvider<string>({
      handler: async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        calls.push('handler');
      },
      provider: () => {
        calls.push('provider');
        return 'value';
      },
    });

    await provider.get();

    expect(calls).to.deep.equal(['handler', 'provider']);
  });

  it('should propagate handler errors without calling the provider', async function () {
    let providerCalls = 0;
    const provider = new TappedProvider<string>({
      handler: async () => {
        throw new Error('handler failed');
      },
      provider: () => {
        providerCalls++;
        return 'value';
      },
    });

    await expect(provider.get()).to.be.rejectedWith('handler failed');
    expect(providerCalls).to.equal(0);
  });

  it('should propagate provider errors', async function () {
    const provider = new TappedProvider<string>({
      handler: () => undefined,
      provider: () => {
        throw new Error('provider failed');
      },
    });

    await expect(provider.get()).to.be.rejectedWith('provider failed');
  });

  it('should accept class instances for the provider and handler', async function () {
    const calls: string[] = [];
    const provider = new TappedProvider<string, string>({
      handler: {
        execute: (ctx: string) => {
          calls.push(`handler:${ctx}`);
        },
      },
      provider: {
        get: (ctx: string) => {
          calls.push(`provider:${ctx}`);
          return 'value';
        },
      },
    });

    expect(await provider.get('ctx')).to.equal('value');
    expect(calls).to.deep.equal(['handler:ctx', 'provider:ctx']);
  });
});
