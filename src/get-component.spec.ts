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

  it('should throw an error when provided undefined without a fallback', function () {
    expect(() =>
      getComponent<{ fn: () => string } | (() => string), () => string>(
        undefined,
        'fn',
      ),
    ).to.throw('Invalid component');
  });

  it('should throw an error when provided null without a fallback', function () {
    expect(() =>
      getComponent<{ fn: () => string } | (() => string), () => string>(
        null,
        'fn',
      ),
    ).to.throw('Invalid component');
  });

  it('should return a function from an object given as fallback', function () {
    const obj = { fn: () => 'value' };

    const result = getComponent<
      { fn: () => string } | (() => string),
      () => string
    >(undefined, 'fn', obj);

    expect(result).to.be.a('function');
    expect(result.name).to.equal('bound fn');
    expect(result()).to.equal('value');
  });

  it('should return a function that is given as fallback', function () {
    const fn = () => {};
    expect(getComponent(undefined, 'fn', fn)).to.equal(fn);
  });

  it('should return the fallback when provided null', function () {
    const fn = () => {};
    expect(getComponent(null, 'fn', fn)).to.equal(fn);
  });
});
