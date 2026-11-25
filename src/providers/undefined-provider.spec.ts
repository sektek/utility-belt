import { expect } from 'chai';

import { OptionalProviderComponent } from '../types/index.js';
import { UndefinedProvider } from './undefined-provider.js';
import { getComponent } from '../get-component.js';

describe('UndefinedProvider', function () {
  it('should resolve to undefined without a context', async function () {
    const provider = new UndefinedProvider();

    expect(await provider.get()).to.be.undefined;
  });

  it('should resolve to undefined with a context', async function () {
    const provider = new UndefinedProvider<string, number>();

    expect(await provider.get(42)).to.be.undefined;
  });

  it('should be resolvable as a provider component', async function () {
    const component: OptionalProviderComponent<string, number> =
      new UndefinedProvider<string, number>();
    const get = getComponent(component, 'get');

    expect(await get(1)).to.be.undefined;
  });

  it('should be accepted by a consumer taking an OptionalProviderComponent', async function () {
    const consume = async (
      source: OptionalProviderComponent<string>,
    ): Promise<string> => {
      const get = getComponent(source, 'get');

      return (await get()) ?? 'fallback';
    };

    expect(await consume(new UndefinedProvider<string>())).to.equal('fallback');
  });
});
