import { randomUUID } from 'crypto';

import { expect, use } from 'chai';
import _ from 'lodash';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { HttpOperator } from './http-operator.js';

use(chaiAsPromised);
use(sinonChai);

describe('HttpOperator', function () {
  let baseUrl: string;
  let url: string;

  before(function () {
    nock.disableNetConnect();
  });

  beforeEach(function () {
    const title = _.kebabCase(this.currentTest?.fullTitle() || randomUUID());
    baseUrl = `https://test.local/${title}`;
    url = `${baseUrl}/`;
  });

  afterEach(async function () {
    nock.cleanAll();
  });

  after(function () {
    nock.enableNetConnect();
  });

  describe('default behavior', function () {
    it('should throw an error if neither urlProvider nor url is provided', function () {
      expect(() => new HttpOperator({})).to.throw(
        'Must provide either urlProvider or url',
      );
    });

    it('should use the provided url', async function () {
      nock(baseUrl).get('/').reply(200, 'OK');

      const operator = new HttpOperator({
        url,
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should include the default content-type header', async function () {
      nock(baseUrl, { reqheaders: { 'Content-Type': 'application/json' } })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator({
        url,
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should throw an error for non-2xx responses', async function () {
      nock(baseUrl).get('/').reply(500, 'Internal Server Error');

      const operator = new HttpOperator({ url });

      await expect(operator.perform()).to.be.rejectedWith(
        'Unexpected status code: 500',
      );
    });

    describe('POST', function () {
      it('should perform a POST request with a JSON serialized body', async function () {
        nock(baseUrl, {
          reqheaders: { 'Content-Type': 'application/json' },
        })
          .post('/', { key: 'value' })
          .reply(200, 'OK');

        const operator = new HttpOperator<Record<string, string>>({
          url,
          method: 'POST',
        });

        const response = await operator.perform({ key: 'value' });
        expect(response.ok).to.be.true;
      });
    });

    describe('PUT', function () {
      it('should perform a PUT request with a JSON serialized body', async function () {
        nock(baseUrl, {
          reqheaders: { 'Content-Type': 'application/json' },
        })
          .put('/', { key: 'value' })
          .reply(200, 'OK');

        const operator = new HttpOperator<Record<string, string>>({
          url,
          method: 'PUT',
        });

        const response = await operator.perform({ key: 'value' });
        expect(response.ok).to.be.true;
      });
    });

    describe('DELETE', function () {
      it('should perform a DELETE request', async function () {
        nock(baseUrl).delete('/').reply(200, 'OK');

        const operator = new HttpOperator({
          url,
          method: 'DELETE',
        });

        const response = await operator.perform();
        expect(response.ok).to.be.true;
      });
    });
  });

  describe('customization', function () {
    it('should allow content-type to be specified', async function () {
      nock(baseUrl, {
        reqheaders: { 'Content-Type': 'application/xml' },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator({
        url,
        contentType: 'application/xml',
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should allow a custom headers provider', async function () {
      nock(baseUrl, {
        reqheaders: { 'X-Custom-Header': 'CustomValue' },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator({
        url,
        headersProvider: () => ({ 'X-Custom-Header': 'CustomValue' }),
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should not use default content-type with headersProvider', async function () {
      nock(baseUrl, {
        reqheaders: { 'X-Custom-Header': 'CustomValue' },
      })
        .get('/')
        .reply(200, 'OK');

      const scope = nock(baseUrl, {
        reqheaders: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'CustomValue',
        },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator({
        url,
        headersProvider: () => ({
          'X-Custom-Header': 'CustomValue',
        }),
      });

      const response = await operator.perform();
      expect(scope.isDone()).to.be.false;
      expect(response.ok).to.be.true;
    });

    it('should allow a specified content-type with a headersProvider', async function () {
      nock(baseUrl, {
        reqheaders: {
          'Content-Type': 'application/xml',
          'X-Custom-Header': 'CustomValue',
        },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator({
        url,
        contentType: 'application/xml',
        headersProvider: () => ({ 'X-Custom-Header': 'CustomValue' }),
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should allow a custom URL provider', async function () {
      nock(baseUrl).get('/custom').reply(200, 'OK');

      const operator = new HttpOperator({
        urlProvider: () => `${baseUrl}/custom`,
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should allow a custom body serializer', async function () {
      nock(baseUrl, {
        reqheaders: { 'Content-Type': 'application/json' },
      })
        .post('/', { key: 'value' })
        .reply(200, 'OK');

      const operator = new HttpOperator<string>({
        url,
        method: 'POST',
        bodySerializer: (body: string) => JSON.stringify({ key: body }),
      });

      const response = await operator.perform('value');
      expect(response.ok).to.be.true;
    });

    it('should allow a timeout to be specified', async function () {
      nock(baseUrl).get('/').delay(1000).reply(200, 'OK');

      const operator = new HttpOperator({
        url,
        timeout: 50, // Shorter than the nock delay
      });

      await expect(operator.perform()).to.be.rejectedWith(
        'The operation was aborted due to timeout',
      );
    });
  });

  describe('event emitters', function () {
    it('should emit request:created with the request object', async function () {
      nock(baseUrl).get('/').reply(200, 'OK');

      const operator = new HttpOperator<string>({
        url,
      });

      const requestCreatedSpy = sinon.spy();
      operator.on('request:created', requestCreatedSpy);

      await operator.perform('test');

      expect(requestCreatedSpy).to.have.been.calledOnce;
      const [arg, request] = requestCreatedSpy.firstCall.args;
      expect(arg).to.equal('test');
      expect(request.method).to.equal('GET');
      expect(request.url).to.equal(url);
    });

    it('should emit request:error on fetch errors', async function () {
      nock(baseUrl).get('/').replyWithError('Network error');

      const operator = new HttpOperator<string>({
        url,
      });

      const requestErrorSpy = sinon.spy();
      operator.on('request:error', requestErrorSpy);

      await expect(operator.perform('test')).to.be.rejectedWith(
        'Network error',
      );

      expect(requestErrorSpy).to.have.been.calledOnce;
      const [arg, request, error] = requestErrorSpy.firstCall.args;
      expect(arg).to.equal('test');
      expect(request.method).to.equal('GET');
      expect(error.message).to.equal('Network error');
    });

    it('should emit response:received with the response object', async function () {
      nock(baseUrl).get('/').reply(200, 'OK');

      const operator = new HttpOperator<string>({
        url,
      });

      const responseReceivedSpy = sinon.spy();
      operator.on('response:received', responseReceivedSpy);

      await operator.perform('test');

      expect(responseReceivedSpy).to.have.been.calledOnce;
      const [arg, response] = responseReceivedSpy.firstCall.args;
      expect(arg).to.equal('test');
      expect(response.ok).to.be.true;
    });

    it('should emit response:error on non-2xx responses', async function () {
      nock(baseUrl).get('/').reply(500, 'Internal Server Error');

      const operator = new HttpOperator<string>({ url });

      const responseErrorSpy = sinon.spy();
      operator.on('response:error', responseErrorSpy);

      await expect(operator.perform('test')).to.be.rejectedWith(
        'Unexpected status code: 500',
      );

      expect(responseErrorSpy).to.have.been.calledOnce;
      const [arg, response, error] = responseErrorSpy.firstCall.args;
      expect(arg).to.equal('test');
      expect(response.status).to.equal(500);
      expect(error.message).to.equal('Unexpected status code: 500');
    });
  });
});
