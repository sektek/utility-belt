import { expect } from 'chai';

import { CompositeHeadersProvider } from './composite-headers-provider.js';

describe('CompositeHeadersProvider', function () {
  it('should return the headers from both providers', async function () {
    const provider1 = () => ({ 'Content-Type': 'application/json' });
    const provider2 = () => ({ Authorization: 'Bearer token' });
    const compositeProvider = new CompositeHeadersProvider({
      providers: [provider1, provider2],
    });

    const headers = await compositeProvider.get({});

    expect(headers.get('Content-Type')).to.equal('application/json');
    expect(headers.get('Authorization')).to.equal('Bearer token');
  });

  it('should handle headers provided as Headers objects', async function () {
    const provider1 = () => new Headers({ 'Content-Type': 'application/json' });
    const provider2 = () => new Headers({ Authorization: 'Bearer token' });
    const compositeProvider = new CompositeHeadersProvider({
      providers: [provider1, provider2],
    });

    const headers = await compositeProvider.get({});

    expect(headers.get('Content-Type')).to.equal('application/json');
    expect(headers.get('Authorization')).to.equal('Bearer token');
  });

  it('should handle headers provided as arrays of tuples', async function () {
    const provider1 = () => [['Content-Type', 'application/json']];
    const provider2 = () => [['Authorization', 'Bearer token']];
    const compositeProvider = new CompositeHeadersProvider({
      providers: [provider1, provider2],
    });

    const headers = await compositeProvider.get({});

    expect(headers.get('Content-Type')).to.equal('application/json');
    expect(headers.get('Authorization')).to.equal('Bearer token');
  });

  it('should handle providers that return undefined', async function () {
    const provider1 = () => ({ 'Content-Type': 'application/json' });
    const provider2 = () => undefined;
    const compositeProvider = new CompositeHeadersProvider({
      providers: [provider1, provider2],
    });

    const headers = await compositeProvider.get({});

    expect(headers.get('Content-Type')).to.equal('application/json');
  });
});
