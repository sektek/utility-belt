import {
  ExecutionPolicy,
  MemoizeExecutionPolicy,
  type RetryExecutionContext,
  RetryableExecutionPolicy,
  SharedExecutionPolicy,
  singleKeyProvider,
} from './execution-policy/index.js';
import { expect } from 'chai';
import sinon from 'sinon';

describe('ExecutionPolicy', function () {
  describe('retryable', function () {
    it('can be applied directly as a bound policy method', async function () {
      const policy = new RetryableExecutionPolicy({ maxAttempts: 2 });
      class Subject {
        calls = 0;
        @policy.wrap.bind(policy)
        async run(): Promise<number> {
          if (++this.calls === 1) throw new Error('temporary');
          return this.calls;
        }
      }
      expect(await new Subject().run()).to.equal(2);
    });

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
          retryPredicate: async context => {
            contexts.push(context);
            return true;
          },
          delayProvider: async context => {
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

    it('stops when retryPredicate returns false', async function () {
      const failure = new Error('permanent');
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({
          maxAttempts: 3,
          retryPredicate: () => false,
        })
        async run(): Promise<void> {
          this.calls += 1;
          throw failure;
        }
      }
      const subject = new Subject();
      await expect(subject.run()).to.be.rejectedWith(failure);
      expect(subject.calls).to.equal(1);
    });

    it('accepts a predicate component', async function () {
      const retryPredicate = {
        test: sinon.stub().onFirstCall().returns(true).returns(false),
      };
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({ maxAttempts: 3, retryPredicate })
        async run(): Promise<void> {
          this.calls += 1;
          throw new Error(`failure-${this.calls}`);
        }
      }
      const subject = new Subject();
      await expect(subject.run()).to.be.rejectedWith('failure-2');
      expect(subject.calls).to.equal(2);
      expect(retryPredicate.test).to.have.been.calledTwice;
      expect(retryPredicate.test.firstCall.firstArg).to.include({ attempt: 1 });
      expect(retryPredicate.test.secondCall.firstArg).to.include({
        attempt: 2,
      });
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

    it('accepts a delay provider component in preference to a fixed delay', async function () {
      const delayProvider = { get: sinon.stub().returns(0) };
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({
          maxAttempts: 2,
          delay: 100,
          delayProvider,
        })
        async run(): Promise<number> {
          if (++this.calls === 1) throw new Error('temporary');
          return this.calls;
        }
      }
      expect(await new Subject().run()).to.equal(2);
      expect(delayProvider.get).to.have.been.calledOnce;
      expect(delayProvider.get.firstCall.firstArg).to.include({ attempt: 1 });
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
        @ExecutionPolicy.retryable({
          maxAttempts: 2,
          delayProvider: () => -1,
        })
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
    it('can be applied directly as a bound policy method', async function () {
      const policy = new SharedExecutionPolicy();
      class Subject {
        calls = 0;
        @policy.wrap.bind(policy)
        async run(): Promise<number> {
          return ++this.calls;
        }
      }
      const subject = new Subject();
      expect(await Promise.all([subject.run(), subject.run()])).to.deep.equal([
        1, 1,
      ]);
    });

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

    it('shares executions by key when a keyProvider is supplied', async function () {
      let releaseA!: () => void;
      const gateA = new Promise<void>(resolve => {
        releaseA = resolve;
      });
      class Subject {
        calls = 0;
        @ExecutionPolicy.shared({ keyProvider: ({ args }) => args[0] })
        async run(shard: string): Promise<string> {
          this.calls += 1;
          if (shard === 'a') await gateA;
          return shard;
        }
      }
      const subject = new Subject();
      const a1 = subject.run('a');
      const a2 = subject.run('a');
      const b1 = subject.run('b');
      expect(a2).to.equal(a1);
      expect(b1).to.not.equal(a1);
      expect(subject.calls).to.equal(2);
      releaseA();
      expect(await Promise.all([a1, a2, b1])).to.deep.equal(['a', 'a', 'b']);
    });

    it('shares one execution for an asynchronous keyProvider', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.shared({
          keyProvider: async ({ args }) => args[0],
        })
        async run(shard: string): Promise<string> {
          this.calls += 1;
          return shard;
        }
      }
      const subject = new Subject();
      const [first, second] = await Promise.all([
        subject.run('a'),
        subject.run('a'),
      ]);
      expect(first).to.equal('a');
      expect(second).to.equal('a');
      expect(subject.calls).to.equal(1);
    });
  });

  describe('memoize', function () {
    it('can be applied directly as a bound policy method', async function () {
      const policy = new MemoizeExecutionPolicy();
      class Subject {
        calls = 0;
        @policy.wrap.bind(policy)
        async run(): Promise<number> {
          return ++this.calls;
        }
      }
      const subject = new Subject();
      expect(await Promise.all([subject.run(), subject.run()])).to.deep.equal([
        1, 1,
      ]);
    });

    it('shares the first in-flight call for the same first argument', async function () {
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize()
        async run(value: string): Promise<string> {
          this.calls += 1;
          await gate;
          return value;
        }
      }
      const subject = new Subject();
      const first = subject.run('shared');
      const second = subject.run('shared');
      expect(second).to.equal(first);
      expect(subject.calls).to.equal(1);
      release();
      expect(await Promise.all([first, second])).to.deep.equal([
        'shared',
        'shared',
      ]);
    });

    it('does not share across different first arguments by default', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize()
        async run(value: string): Promise<string> {
          this.calls += 1;
          return value;
        }
      }
      const subject = new Subject();
      expect(
        await Promise.all([subject.run('a'), subject.run('b')]),
      ).to.deep.equal(['a', 'b']);
      expect(subject.calls).to.equal(2);
    });

    it('retains a successful execution and never invokes the method again', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize()
        async run(): Promise<number> {
          return ++this.calls;
        }
      }
      const subject = new Subject();
      expect(await subject.run()).to.equal(1);
      expect(await subject.run()).to.equal(1);
      expect(await subject.run()).to.equal(1);
      expect(subject.calls).to.equal(1);
    });

    it('clears a failed execution so the next call retries', async function () {
      const failure = new Error('first call failed');
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize()
        async run(): Promise<number> {
          this.calls += 1;
          if (this.calls === 1) throw failure;
          return this.calls;
        }
      }
      const subject = new Subject();
      await expect(subject.run()).to.be.rejectedWith(failure);
      expect(await subject.run()).to.equal(2);
      expect(await subject.run()).to.equal(2);
    });

    it('isolates executions by object instance', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize()
        async run(): Promise<number> {
          return ++this.calls;
        }
      }
      const first = new Subject();
      const second = new Subject();
      expect(await first.run()).to.equal(1);
      expect(await second.run()).to.equal(1);
    });

    it('retains executions independently by first argument by default', async function () {
      class Subject {
        calls = 0;
        connections: Record<string, number> = {};
        @ExecutionPolicy.memoize()
        async run(shard: string): Promise<number> {
          this.calls += 1;
          this.connections[shard] = this.calls;
          return this.connections[shard];
        }
      }
      const subject = new Subject();
      expect(await subject.run('a')).to.equal(1);
      expect(await subject.run('b')).to.equal(2);
      expect(await subject.run('a')).to.equal(1);
      expect(await subject.run('b')).to.equal(2);
      expect(subject.calls).to.equal(2);
    });

    it('shares and retains one execution for an asynchronous keyProvider', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize({
          keyProvider: async ({ args }) => args[0],
        })
        async run(shard: string): Promise<string> {
          this.calls += 1;
          return shard;
        }
      }
      const subject = new Subject();
      const [first, second] = await Promise.all([
        subject.run('a'),
        subject.run('a'),
      ]);
      expect(first).to.equal('a');
      expect(second).to.equal('a');
      expect(await subject.run('a')).to.equal('a');
      expect(subject.calls).to.equal(1);
    });

    it('memoizes the whole method when given singleKeyProvider', async function () {
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize({ keyProvider: singleKeyProvider })
        async run(value: string): Promise<string> {
          this.calls += 1;
          return value;
        }
      }
      const subject = new Subject();
      expect(await subject.run('a')).to.equal('a');
      expect(await subject.run('b')).to.equal('a');
      expect(subject.calls).to.equal(1);
    });

    it('types keyProvider args from an explicit KeyArgs parameter, without casting', async function () {
      type UserEvent = { userId: string };
      class Subject {
        calls = 0;
        @ExecutionPolicy.memoize<[UserEvent]>({
          // No cast needed: `event` below is typed as UserEvent, not unknown.
          keyProvider: ({ args: [event] }) => event.userId,
        })
        async handle(event: UserEvent): Promise<string> {
          this.calls += 1;
          return event.userId;
        }
      }
      const subject = new Subject();
      expect(await subject.handle({ userId: 'u1' })).to.equal('u1');
      expect(await subject.handle({ userId: 'u1' })).to.equal('u1');
      expect(await subject.handle({ userId: 'u2' })).to.equal('u2');
      expect(subject.calls).to.equal(2);
    });
  });

  describe('composition', function () {
    it('shares an entire retry sequence when shared is outermost', async function () {
      const retryPredicate = sinon.stub().returns(true);
      class Subject {
        calls = 0;
        @ExecutionPolicy.shared()
        @ExecutionPolicy.retryable({ maxAttempts: 2, retryPredicate })
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
      expect(retryPredicate).to.have.been.calledOnce;
    });

    it('runs retry sequences outside shared attempts in reverse order', async function () {
      const retryPredicate = sinon.stub().returns(true);
      let release!: () => void;
      const gate = new Promise<void>(resolve => {
        release = resolve;
      });
      class Subject {
        calls = 0;
        @ExecutionPolicy.retryable({ maxAttempts: 2, retryPredicate })
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
      expect(retryPredicate).to.have.been.calledTwice;
    });
  });
});
