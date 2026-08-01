import {
  ExecutionPolicy,
  type RetryExecutionContext,
} from './execution-policy.js';
import { expect } from 'chai';
import sinon from 'sinon';

describe('ExecutionPolicy', function () {
  describe('retryable', function () {
    it('returns successful results without retrying', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({ maxAttempts: 3 })
        async run(value: string): Promise<string> {
          this.calls += 1;
          return value;
        }
      }
      const subject = new Subject();
      expect(await subject.run('ok')).to.equal('ok');
      expect(subject.calls).to.equal(1);
    });

    it('retries with the original receiver and arguments', async function () {
      class Subject {
        calls = 0;
        prefix = 'value';
        @ExecutionPolicy.retryable({ maxAttempts: 3 })
        async run(suffix: string): Promise<string> {
          this.calls += 1;
          if (this.calls < 3) throw new Error('temporary');
          return `${this.prefix}-${suffix}`;
        }
      }
      const subject = new Subject();
      expect(await subject.run('result')).to.equal('value-result');
      expect(subject.calls).to.equal(3);
    });

    it('propagates the final rejection unchanged', async function () {
      const failure = { reason: 'unavailable' };
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({ maxAttempts: 2 })
        async run(): Promise<void> {
          this.calls += 1;
          throw failure;
        }
      }
      const subject = new Subject();
      let caught: unknown;
      try {
        await subject.run();
      } catch (error) {
        caught = error;
      }
      expect(caught).to.equal(failure);
      expect(subject.calls).to.equal(2);
    });

    it('passes context to async filters and delays', async function () {
      const contexts: RetryExecutionContext[] = [];
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({
          maxAttempts: 3,
          retryIf: async context => {
            contexts.push(context);
            return true;
          },
          delay: async context => {
            contexts.push(context);
            return 0;
          },
        })
        async run(): Promise<void> {
          this.calls += 1;
          if (this.calls < 3) throw new Error(`failure-${this.calls}`);
        }
      }
      await new Subject().run();
      expect(contexts.map(context => context.attempt)).to.deep.equal([
        1, 1, 2, 2,
      ]);
      expect(contexts.every(context => context.maxAttempts === 3)).to.be.true;
      expect(
        contexts.map(context => (context.error as Error).message),
      ).to.deep.equal(['failure-1', 'failure-1', 'failure-2', 'failure-2']);
    });

    it('stops when retryIf returns false', async function () {
      const failure = new Error('permanent');
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({ maxAttempts: 3, retryIf: () => false })
        async run(): Promise<void> {
          this.calls += 1;
          throw failure;
        }
      }
      const subject = new Subject();
      await expect(subject.run()).to.be.rejectedWith(failure);
      expect(subject.calls).to.equal(1);
    });

    it('waits for a fixed delay only before retrying', async function () {
      const clock = sinon.useFakeTimers();
      try {
        class Subject {
          calls = 0;
          @ExecutionPolicy.retryable({ maxAttempts: 2, delay: 25 })
          async run(): Promise<void> {
            this.calls += 1;
            if (this.calls === 1) throw new Error('temporary');
          }
        }
        const subject = new Subject();
        const result = subject.run();
        await clock.tickAsync(24);
        expect(subject.calls).to.equal(1);
        await clock.tickAsync(1);
        await result;
        expect(subject.calls).to.equal(2);
      } finally {
        clock.restore();
      }
    });

    it('rejects invalid maxAttempts values', function () {
      for (const maxAttempts of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
        expect(() => {
          class Subject {
            @ExecutionPolicy.retryable({ maxAttempts })
            async run(): Promise<void> {}
          }

          return new Subject();
        }).to.throw(RangeError, 'maxAttempts must be a positive safe integer');
      }
    });

    it('rejects invalid fixed delays', function () {
      for (const delay of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => {
          class Subject {
            @ExecutionPolicy.retryable({ maxAttempts: 2, delay })
            async run(): Promise<void> {}
          }

          return new Subject();
        }).to.throw(
          RangeError,
          'Retry delay must be a finite, non-negative number',
        );
      }
    });

    it('rejects an invalid computed delay', async function () {
      class Subject {
        @ExecutionPolicy.retryable({ maxAttempts: 2, delay: () => -1 })
        async run(): Promise<void> {
          throw new Error('temporary');
        }
      }
      await expect(new Subject().run()).to.be.rejectedWith(
        RangeError,
        'Retry delay must be a finite, non-negative number',
      );
    });

    it('rejects synchronous methods at compile time and runtime', async function () {
      class Subject {
        // @ts-expect-error ExecutionPolicy only supports asynchronous methods.
        @ExecutionPolicy.retryable({ maxAttempts: 1 })
        run(): string {
          return 'sync';
        }
      }
      await expect(
        (new Subject().run as unknown as () => Promise<string>)(),
      ).to.be.rejectedWith(
        TypeError,
        'ExecutionPolicy can only decorate asynchronous methods',
      );
    });
  });

  describe('shared', function () {
    it('shares the first in-flight call regardless of arguments', async function () {
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      class Subject {
        calls = 0;
        @ExecutionPolicy.shared({})
        async run(value: string): Promise<string> {
          this.calls += 1;
          await gate;
          return value;
        }
      }
      const subject = new Subject();
      const first = subject.run('first');
      const second = subject.run('second');
      expect(second).to.equal(first);
      expect(subject.calls).to.equal(1);
      release();
      expect(await Promise.all([first, second])).to.deep.equal([
        'first',
        'first',
      ]);
    });

    it('clears successful and failed executions after settlement', async function () {
      const failure = new Error('first call failed');
      class Subject {
        calls = 0;
        @ExecutionPolicy.shared()
        async run(): Promise<number> {
          this.calls += 1;
          if (this.calls === 1) throw failure;
          return this.calls;
        }
      }
      const subject = new Subject();
      const first = subject.run();
      const shared = subject.run();
      expect(shared).to.equal(first);
      await expect(first).to.be.rejectedWith(failure);
      await expect(shared).to.be.rejectedWith(failure);
      expect(await subject.run()).to.equal(2);
    });

    it('isolates executions by object instance', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.shared()
        async run(): Promise<number> {
          return ++this.calls;
        }
      }
      const first = new Subject();
      const second = new Subject();
      expect(await Promise.all([first.run(), second.run()])).to.deep.equal([
        1, 1,
      ]);
    });
  });

  describe('composition', function () {
    it('shares an entire retry sequence when shared is outermost', async function () {
      const retryIf = sinon.stub().returns(true);
      class Subject {
        calls = 0;
        @ExecutionPolicy.shared()
        @ExecutionPolicy.retryable({ maxAttempts: 2, retryIf })
        async run(): Promise<number> {
          this.calls += 1;
          if (this.calls === 1) throw new Error('temporary');
          return this.calls;
        }
      }
      const subject = new Subject();
      expect(await Promise.all([subject.run(), subject.run()])).to.deep.equal([
        2, 2,
      ]);
      expect(subject.calls).to.equal(2);
      expect(retryIf).to.have.been.calledOnce;
    });

    it('runs retry sequences outside shared attempts in reverse order', async function () {
      const retryIf = sinon.stub().returns(true);
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({ maxAttempts: 2, retryIf })
        @ExecutionPolicy.shared()
        async run(): Promise<number> {
          this.calls += 1;
          if (this.calls === 1) {
            await gate;
            throw new Error('temporary');
          }
          return this.calls;
        }
      }
      const subject = new Subject();
      const first = subject.run();
      const second = subject.run();
      release();
      expect(await Promise.all([first, second])).to.deep.equal([2, 2]);
      expect(subject.calls).to.equal(2);
      expect(retryIf).to.have.been.calledTwice;
    });
  });
});
