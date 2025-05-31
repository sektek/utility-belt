import { expect } from 'chai';

import { getComponent } from './get-component.js';

describe('getComponent', function () {
  it('should return a bound function from an object', function () {
    const obj = { fn: () => 'value' };
    const result = getComponent<
      { fn: () => string } | (() => string),
      () => string
    >(obj, 'fn');

    expect(result).to.be.a('function');
    expect(result.name).to.equal('bound fn');
    expect(result()).to.equal('value');
  });

  it('should return a function if the object is a function', function () {
    const fn = () => 'value';
    const result = getComponent<
      { fn: () => string } | (() => string),
      () => string
    >(fn, 'fn');
    expect(result).to.equal(fn);
  });

  it('should throw an error when provided undefined without options', function () {
    expect(() =>
      getComponent<{ fn: () => string } | (() => string), () => string>(
        undefined,
        'fn',
      ),
    ).to.throw('Invalid component');
  });

  it('should throw an error when provided null without options', function () {
    expect(() =>
      getComponent<{ fn: () => string } | (() => string), () => string>(
        null,
        'fn',
      ),
    ).to.throw('Invalid component');
  });

  it('should return a function from an object given as default', function () {
    const obj = { fn: () => 'value' };

    const result = getComponent<
      { fn: () => string } | (() => string),
      () => string
    >(undefined, 'fn', { default: obj });

    expect(result).to.be.a('function');
    expect(result.name).to.equal('bound fn');
    expect(result()).to.equal('value');
  });

  it('should return a function from an object returned by a defaultProvider', function () {
    const obj = { fn: () => 'value' };

    const result = getComponent<
      { fn: () => string } | (() => string),
      () => string
    >(undefined, 'fn', { defaultProvider: () => obj });

    expect(result).to.be.a('function');
    expect(result.name).to.equal('bound fn');
    expect(result()).to.equal('value');
  });

  it('should return a function that is given as default', function () {
    const fn = () => {};
    expect(getComponent(undefined, 'fn', { default: fn })).to.equal(fn);
  });

  it('should return a function from returned by a defaultProvider', function () {
    const fn = () => 'default value';
    expect(
      getComponent(undefined, 'fn', { defaultProvider: () => fn }),
    ).to.equal(fn);
  });

  it('should return the fallback when provided null', function () {
    const fn = () => {};
    expect(getComponent(null, 'fn', { default: fn })).to.equal(fn);
  });

  it('should include the provided name in the error message', function () {
    expect(() =>
      getComponent<{ fn: () => string } | (() => string), () => string>(
        undefined,
        'fn',
        { name: 'testName' },
      ),
    ).to.throw('Invalid testName');
  });
});
