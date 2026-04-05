import { expect, use } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { AbstractComponent, ComponentOptions } from './abstract-component.js';
import { NullLoggerProvider } from './null-logger-provider.js';

use(sinonChai);

class ConcreteComponent extends AbstractComponent {
  constructor(opts?: ComponentOptions) {
    super(opts);
  }
}

describe('AbstractComponent', function () {
  describe('name', function () {
    it('should auto-generate a name using the class name', function () {
      const component = new ConcreteComponent();
      expect(component.name).to.match(/^ConcreteComponent#\d+$/);
    });

    it('should use the provided name', function () {
      const component = new ConcreteComponent({ name: 'my-component' });
      expect(component.name).to.equal('my-component');
    });

    it('should increment the counter for each unnamed instance of the same class', function () {
      const first = new ConcreteComponent();
      const second = new ConcreteComponent();
      const id1 = parseInt(first.name.split('#')[1]);
      const id2 = parseInt(second.name.split('#')[1]);
      expect(id2).to.equal(id1 + 1);
    });

    it('should maintain independent counters for different class names', function () {
      class OtherComponent extends AbstractComponent {}
      const a = new ConcreteComponent();
      const b = new OtherComponent();
      expect(a.name).to.match(/^ConcreteComponent#\d+$/);
      expect(b.name).to.match(/^OtherComponent#\d+$/);
    });
  });

  describe('loggerProvider', function () {
    it('should default to a NullLoggerProvider', function () {
      const component = new ConcreteComponent();
      expect(component.loggerProvider).to.be.instanceOf(NullLoggerProvider);
    });

    it('should use the provided loggerProvider', function () {
      const loggerProvider = new NullLoggerProvider();
      const component = new ConcreteComponent({ loggerProvider });
      expect(component.loggerProvider).to.equal(loggerProvider);
    });
  });

  describe('logger()', function () {
    it('should return the logger from the loggerProvider', function () {
      const fakeLogger = {};
      const loggerProvider = {
        get: sinon.fake.returns(fakeLogger),
        with: sinon.fake(),
      };
      const component = new ConcreteComponent({
        loggerProvider: loggerProvider as never,
      });
      expect(component.logger()).to.equal(fakeLogger);
    });

    it('should pass the object to loggerProvider.get()', function () {
      class TypedComponent extends AbstractComponent<{ requestId: string }> {}
      const loggerProvider = { get: sinon.fake(), with: sinon.fake() };
      const component = new TypedComponent({ loggerProvider });
      const obj = { requestId: 'abc' };
      component.logger(obj);
      expect(loggerProvider.get).to.have.been.calledOnceWith(obj);
    });
  });
});
