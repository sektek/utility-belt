import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';

import { HttpOperator } from './http-operator.js';
import { HttpProvider } from './http-provider.js';

use(chaiAsPromised);

describe('HttpProvider', function () {
  before(function () {
    nock.disableNetConnect();
  });

  afterEach(function () {
    nock.cleanAll();
  });

  after(function () {
    nock.enableNetConnect();
  });

  describe('Default Behavior', function () {
    it('should throw an error if httpOperator, url or urlProvider is not provided', function () {
      expect(() => new HttpProvider({})).to.throw(
        'HttpProvider requires either an httpOperator, url, or urlProvider to be provided.',
      );
    });

    it('should use the provided url', async function () {
      const url = 'http://test.local';
      nock(url).get('/').reply(200, { success: true });

      const provider = new HttpProvider<unknown, void>({
        url,
      });

      const result = await provider.get();
      expect(result).to.deep.equal({ success: true });
    });

    it('should throw an error if the request fails', async function () {
      const url = 'http://test.local';
      nock(url).get('/').reply(500, 'Internal Server Error');

      const provider = new HttpProvider<unknown, void>({
        url,
      });

      await expect(provider.get()).to.be.rejectedWith(
        'Unable to obtain resource: Unexpected status code: 500',
      );
    });

    it('should handle errors in response deserialization', async function () {
      const url = 'http://test.local';
      nock(url).get('/').reply(200, 'Invalid JSON');

      const provider = new HttpProvider<unknown, void>({
        url,
        responseDeserializer: async () => {
          throw new Error('No worky');
        },
      });

      await expect(provider.get()).to.be.rejectedWith(
        'Unable to obtain resource: No worky',
      );
    });
  });

  describe('provider customization', function () {
    it('should use the provided httpOperator', async function () {
      const url = 'http://test.local';
      nock(url).get('/').reply(200, { success: true });

      const customOperator = new HttpOperator({
        method: 'GET',
        url,
      });

      const provider = new HttpProvider<unknown, void>({
        httpOperator: customOperator,
      });

      const result = await provider.get();
      expect(result).to.deep.equal({ success: true });
    });

    it('should use provided responseDeserializer', async function () {
      const url = 'http://test.local';
      nock(url).get('/').reply(200, { success: true });

      const customDeserializer = async (response: Response) => ({
        data: await response.text(),
      });

      const provider = new HttpProvider<{ data: string }, void>({
        url,
        responseDeserializer: customDeserializer,
      });

      const result = await provider.get();
      expect(result).to.deep.equal({ data: '{"success":true}' });
    });
  });

  describe('HttpOperator customization', function () {
    it('should use the provided urlProvider', async function () {
      const url = 'http://test.local';
      nock(url).get('/').reply(200, { success: true });

      const provider = new HttpProvider<unknown, void>({
        urlProvider: () => url,
      });

      const result = await provider.get();
      expect(result).to.deep.equal({ success: true });
    });

    it('should use the provided method', async function () {
      const url = 'http://test.local';
      nock(url).post('/').reply(200, { success: true });

      const provider = new HttpProvider<unknown, void>({
        url,
        method: 'POST',
      });

      const result = await provider.get();
      expect(result).to.deep.equal({ success: true });
    });

    it('should use the provided headersProvider', async function () {
      const url = 'http://test.local';
      nock(url, {
        reqheaders: {
          'X-Custom-Header': 'my-value',
        },
      })
        .get('/')
        .reply(200, { success: true });

      const provider = new HttpProvider<unknown, void>({
        url,
        headersProvider: () => ({
          'X-Custom-Header': 'my-value',
        }),
      });

      const result = await provider.get();
      expect(result).to.deep.equal({ success: true });
    });

    it('should use the default content type if not provided', async function () {
      const url = 'http://test.local';
      nock(url, {
        reqheaders: {
          'Content-Type': 'application/json',
        },
      })
        .get('/')
        .reply(200, { success: true });

      const provider = new HttpProvider<unknown, void>({
        url,
      });

      const result = await provider.get();
      expect(result).to.deep.equal({ success: true });
    });

    it('should allow a custom content type', async function () {
      const url = 'http://test.local';
      nock(url, {
        reqheaders: {
          'Content-Type': 'application/xml',
        },
      })
        .get('/')
        .reply(200, '<response>Success</response>');

      const provider = new HttpProvider<unknown, void>({
        url,
        contentType: 'application/xml',
        responseDeserializer: async (response: Response) => {
          return response.text(); // Custom deserializer for XML
        },
      });

      const result = await provider.get();
      expect(result).to.deep.equal('<response>Success</response>');
    });
  });
});
