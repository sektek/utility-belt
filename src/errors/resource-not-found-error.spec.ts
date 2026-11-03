import { expect } from 'chai';

import { ResourceNotFoundError } from './resource-not-found-error.js';

describe('ResourceNotFoundError', function () {
  it('is an Error named ResourceNotFoundError', function () {
    const err = new ResourceNotFoundError();

    expect(err).to.be.instanceOf(Error);
    expect(err).to.be.instanceOf(ResourceNotFoundError);
    expect(err.name).to.equal('ResourceNotFoundError');
  });

  it('has a default message', function () {
    expect(new ResourceNotFoundError().message).to.equal('Resource not found');
  });

  it('describes the resource and id in the default message', function () {
    const err = new ResourceNotFoundError({ resource: 'Job', id: 'abc' });

    expect(err.message).to.equal('Job not found: abc');
  });

  it('exposes the resource and id', function () {
    const err = new ResourceNotFoundError({ resource: 'Job', id: 42 });

    expect(err.resource).to.equal('Job');
    expect(err.id).to.equal(42);
  });

  it('uses a supplied message', function () {
    const err = new ResourceNotFoundError({ message: 'nope', id: 1 });

    expect(err.message).to.equal('nope');
  });

  it('keeps the cause', function () {
    const cause = new Error('underlying');

    expect(new ResourceNotFoundError({ cause }).cause).to.equal(cause);
  });
});
