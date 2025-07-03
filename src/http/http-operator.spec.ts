import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import nock from 'nock';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { HttpOperator } from './http-operator.js';

use(chaiAsPromised);
use(sinonChai);

describe('HttpOperator', function () {
  before(function () {
    nock.disableNetConnect();
  });

  afterEach(function () {
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
      nock('http://test.local').get('/').reply(200, 'OK');

      const operator = new HttpOperator<void>({
        url: 'http://test.local',
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should include the default content-type header', async function () {
      nock('http://test.local', {
        reqheaders: { 'Content-Type': 'application/json' },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator({
        url: 'http://test.local',
      });

      const response = await operator.perform('');
      expect(response.ok).to.be.true;
    });

    it('should throw an error for non-2xx responses', async function () {
      nock('http://test.local').get('/').reply(500, 'Internal Server Error');

      const operator = new HttpOperator({
        url: 'http://test.local',
      });

      await expect(operator.perform('')).to.be.rejectedWith(
        'Unexpected status code: 500',
      );
    });

    describe('POST', function () {
      it('should perform a POST request with a JSON serialized body', async function () {
        nock('http://test.local', {
          reqheaders: { 'Content-Type': 'application/json' },
        })
          .post('/', { key: 'value' })
          .reply(200, 'OK');

        const operator = new HttpOperator({
          url: 'http://test.local',
          method: 'POST',
        });

        const response = await operator.perform({ key: 'value' });
        expect(response.ok).to.be.true;
      });
    });

    describe('PUT', function () {
      it('should perform a PUT request with a JSON serialized body', async function () {
        nock('http://test.local', {
          reqheaders: { 'Content-Type': 'application/json' },
        })
          .put('/', { key: 'value' })
          .reply(200, 'OK');

        const operator = new HttpOperator({
          url: 'http://test.local',
          method: 'PUT',
        });

        const response = await operator.perform({ key: 'value' });
        expect(response.ok).to.be.true;
      });
    });

    describe('DELETE', function () {
      it('should perform a DELETE request', async function () {
        nock('http://test.local').delete('/').reply(200, 'OK');

        const operator = new HttpOperator<void>({
          url: 'http://test.local',
          method: 'DELETE',
        });

        const response = await operator.perform();
        expect(response.ok).to.be.true;
      });
    });
  });

  describe('customization', function () {
    it('should allow content-type to be specified', async function () {
      nock('http://test.local', {
        reqheaders: { 'Content-Type': 'application/xml' },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator<void>({
        url: 'http://test.local',
        contentType: 'application/xml',
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should allow a custom headers provider', async function () {
      nock('http://test.local', {
        reqheaders: { 'X-Custom-Header': 'CustomValue' },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator<void>({
        url: 'http://test.local',
        headersProvider: () => ({ 'X-Custom-Header': 'CustomValue' }),
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should not use default content-type with headersProvider', async function () {
      nock('http://test.local', {
        reqheaders: { 'X-Custom-Header': 'CustomValue' },
      })
        .get('/')
        .reply(200, 'OK');

      const scope = nock('http://test.local', {
        reqheaders: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'CustomValue',
        },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator<void>({
        url: 'http://test.local',
        headersProvider: () => ({
          'X-Custom-Header': 'CustomValue',
        }),
      });

      const response = await operator.perform();
      expect(scope.isDone()).to.be.false;
      expect(response.ok).to.be.true;
    });

    it('should allow a specified content-type with a headersProvider', async function () {
      nock('http://test.local', {
        reqheaders: {
          'Content-Type': 'application/xml',
          'X-Custom-Header': 'CustomValue',
        },
      })
        .get('/')
        .reply(200, 'OK');

      const operator = new HttpOperator<void>({
        url: 'http://test.local',
        contentType: 'application/xml',
        headersProvider: () => ({ 'X-Custom-Header': 'CustomValue' }),
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should allow a custom URL provider', async function () {
      nock('http://test.local').get('/custom').reply(200, 'OK');

      const operator = new HttpOperator<void>({
        urlProvider: () => 'http://test.local/custom',
      });

      const response = await operator.perform();
      expect(response.ok).to.be.true;
    });

    it('should allow a custom body serializer', async function () {
      nock('http://test.local', {
        reqheaders: { 'Content-Type': 'application/json' },
      })
        .post('/', { key: 'value' })
        .reply(200, 'OK');

      const operator = new HttpOperator<string>({
        url: 'http://test.local',
        method: 'POST',
        bodySerializer: (body: string) => JSON.stringify({ key: body }),
      });

      const response = await operator.perform('value');
      expect(response.ok).to.be.true;
    });

    it('should allow a timeout to be specified', async function () {
      nock('http://test.local').get('/').delay(100).reply(200, 'OK');

      const operator = new HttpOperator<void>({
        url: 'http://test.local',
        timeout: 50, // Shorter than the nock delay
      });

      await expect(operator.perform()).to.be.rejectedWith(
        'The operation was aborted due to timeout',
      );
    });
  });

  describe('event emitters', function () {
    it('should emit request:created with the request object', async function () {
      nock('http://test.local').get('/').reply(200, 'OK');

      const operator = new HttpOperator<string>({
        url: 'http://test.local',
      });

      const requestCreatedSpy = sinon.spy();
      operator.on('request:created', requestCreatedSpy);

      await operator.perform('test');

      expect(requestCreatedSpy).to.have.been.calledOnce;
      const [arg, request] = requestCreatedSpy.firstCall.args;
      expect(arg).to.equal('test');
      expect(request.method).to.equal('GET');
      expect(request.url).to.equal('http://test.local/');
    });

    it('should emit request:error on fetch errors', async function () {
      nock('http://test.local').get('/').replyWithError('Network error');

      const operator = new HttpOperator<string>({
        url: 'http://test.local',
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
      nock('http://test.local').get('/').reply(200, 'OK');

      const operator = new HttpOperator<string>({
        url: 'http://test.local',
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
      nock('http://test.local').get('/').reply(500, 'Internal Server Error');

      const operator = new HttpOperator<string>({
        url: 'http://test.local',
      });

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
