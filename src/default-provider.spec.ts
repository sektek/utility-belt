import { expect } from 'chai';

import { DefaultProvider } from './default-provider.js';

describe('DefaultProvider', function () {
  describe('class', function () {
    it('should create an instance with the provided provider', function () {
      const mockProvider = () => `Hello, World!`;

      const provider = new DefaultProvider<string>({
        provider: mockProvider,
        defaultValue: 'Default Value',
      });

      expect(provider).to.be.instanceOf(DefaultProvider);
      expect(provider).to.have.property('get').that.is.a('function');
    });

    it('should throw an error if neither defaultValue nor defaultValueProvider is provided', function () {
      const mockProvider = () => undefined;

      expect(
        () =>
          new DefaultProvider<string>({
            provider: mockProvider,
          }),
      ).to.throw(
        'Either defaultValue or defaultValueProvider must be provided.',
      );
    });

    it('should call the provider and return the result', async function () {
      const mockProvider = (arg?: string) => `Hello, ${arg || 'World'}!`;

      const provider = new DefaultProvider<string, string>({
        provider: mockProvider,
        defaultValue: 'Default Value',
      });

      const result = await provider.get('Alice');

      expect(result).to.equal('Hello, Alice!');
    });

    it('should return default value if provider returns undefined', async function () {
      const mockProvider = () => undefined;

      const provider = new DefaultProvider<string>({
        provider: mockProvider,
        defaultValue: 'Default Value',
      });

      const result = await provider.get();

      expect(result).to.equal('Default Value');
    });

    it('should handle provider that does not expect an argument', async function () {
      const mockProvider = () => 'No argument needed';

      const provider = new DefaultProvider<string>({
        provider: mockProvider,
        defaultValue: 'Default Value',
      });

      const result = await provider.get();

      expect(result).to.equal('No argument needed');
    });

    it('should allow a default value provider', async function () {
      const mockProvider = () => undefined;
      const defaultValueProvider = () => 'Default Value from Provider';

      const provider = new DefaultProvider<string>({
        provider: mockProvider,
        defaultValueProvider,
      });

      const result = await provider.get();

      expect(result).to.equal('Default Value from Provider');
    });
  });

  describe('wrap', function () {
    it('should return a function that calls the provider and returns the result', async function () {
      const mockProvider = (arg?: string) => `Hello, ${arg || 'World'}!`;

      const wrappedProvider = DefaultProvider.wrap(
        mockProvider,
        'Default Value',
      );

      const result = await wrappedProvider.get('Alice');

      expect(wrappedProvider).to.be.instanceOf(DefaultProvider);
      expect(result).to.equal('Hello, Alice!');
    });
  });
});
