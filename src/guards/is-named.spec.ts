import { expect } from 'chai';

import { isNamed } from './is-named.js';

describe('isNamed', function () {
  it('returns true for an object with a string name property', function () {
    expect(isNamed({ name: 'foo' })).to.be.true;
  });

  it('returns true for a class instance with a name property', function () {
    class MyService {
      name = 'my-service';
    }
    expect(isNamed(new MyService())).to.be.true;
  });

  it('returns false when name is not a string', function () {
    expect(isNamed({ name: 42 })).to.be.false;
  });

  it('returns false when name property is absent', function () {
    expect(isNamed({ label: 'foo' })).to.be.false;
  });

  it('returns false for null', function () {
    expect(isNamed(null)).to.be.false;
  });

  it('returns false for undefined', function () {
    expect(isNamed(undefined)).to.be.false;
  });

  it('returns false for a plain string', function () {
    expect(isNamed('foo')).to.be.false;
  });

  it('returns false for a number', function () {
    expect(isNamed(42)).to.be.false;
  });

  it('returns true for a class instance with a getter for name', function () {
    class MyService {
      get name() {
        return 'my-service';
      }
    }
    expect(isNamed(new MyService())).to.be.true;
  });
});
