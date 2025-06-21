import { expect } from 'chai';

import { ProviderWrapper, wrapOptionalProvider } from './provider-wrapper.js';
import { OptionalProvider } from './types/optional-provider.js';

describe('ProviderWrapper', function () {
  describe('class', function () {
    it('should create an instance with the provided provider', function () {
      const mockProvider = {
        get: async (arg?: string) => `Hello, ${arg || 'World'}!`,
      };
      const providerWrapper = new ProviderWrapper({ provider: mockProvider });
      expect(providerWrapper).to.be.instanceOf(ProviderWrapper);
      expect(providerWrapper).to.have.property('get').that.is.a('function');
    });

    it('should call the provider and return the result', async function () {
      const mockProvider = {
        get: async (arg?: string) => `Hello, ${arg || 'World'}!`,
      };
      const providerWrapper = new ProviderWrapper({ provider: mockProvider });
      const result = await providerWrapper.get('Alice');
      expect(result).to.equal('Hello, Alice!');
    });

    it('should throw an error if provider returns undefined and no default value is provided', async function () {
      const mockProvider = {
        get: async () => undefined,
      };
      const providerWrapper = new ProviderWrapper({ provider: mockProvider });
      await expect(providerWrapper.get()).to.be.rejectedWith(
        'Provider returned undefined',
      );
    });

    it('should return default value if provider returns undefined', async function () {
      const mockProvider: OptionalProvider<string> = {
        get: async () => undefined,
      };
      const providerWrapper = new ProviderWrapper({
        provider: mockProvider,
        defaultValue: 'Default Value',
      });
      const result = await providerWrapper.get();
      expect(result).to.equal('Default Value');
    });
  });

  describe('wrapProvider', function () {
    it('should return a function that calls the provider and returns the result', async function () {
      const mockProvider = {
        get: async (arg?: string) => `Hello, ${arg || 'World'}!`,
      };

      const wrappedProvider = wrapOptionalProvider(mockProvider);
      const result = await wrappedProvider('Alice');
      expect(result).to.equal('Hello, Alice!');
    });

    it('should return default value if provider returns undefined', async function () {
      const mockProvider: OptionalProvider<string> = {
        get: async () => undefined,
      };

      const wrappedProvider = wrapOptionalProvider(
        mockProvider,
        'Default Value',
      );
      const result = await wrappedProvider();
      expect(result).to.equal('Default Value');
    });

    it('should throw an error if provider returns undefined and no default value is provided', async function () {
      const mockProvider = {
        get: async () => undefined,
      };

      const wrappedProvider = wrapOptionalProvider(mockProvider);
      await expect(wrappedProvider()).to.be.rejectedWith(
        'Provider returned undefined',
      );
    });
  });
});
