import { expect } from 'chai';

import { contentTypeHeadersProvider } from './content-type-headers-provider.js';

describe('ContentTypeHeadersProvider', function () {
  it('should return the headers with the content type', async function () {
    const provider = contentTypeHeadersProvider('application/json');

    expect(provider({})).to.deep.equal({
      'Content-Type': 'application/json',
    });
  });
});
