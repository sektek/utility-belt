# Utility Belt

General utilities to be used within @sektek projects

## Execution policies

Execution policy classes wrap asynchronous functions with reusable execution
behavior. `ExecutionPolicy` adapts those policies into composable method
decorators.

```ts
import { RetryableExecutionPolicy } from '@sektek/utility-belt';

const retryable = new RetryableExecutionPolicy({ maxAttempts: 3 });
const fetchWithRetry = retryable.wrap(fetchResource);

await fetchWithRetry(resourceId);
```

```ts
import { ExecutionPolicy } from '@sektek/utility-belt';

class ResourceLoader {
  @ExecutionPolicy.shared({})
  @ExecutionPolicy.retryable({
    maxAttempts: 3,
    delayProvider: ({ attempt }) => attempt * 100,
    retryPredicate: ({ error }) => error instanceof Error,
  })
  async load(): Promise<string> {
    return 'resource';
  }
}
```

Decorators are applied from the method outward. Here, `retryable` wraps
`load` first and `shared` wraps the complete retry sequence, so concurrent
callers share one sequence and its final outcome.

`shared` and `memoize` both let concurrent calls on the same receiver and
key reuse one execution instead of starting duplicate work. They differ in
what happens once that execution settles, and in how they key by default:

- `shared` always clears the execution once it settles, so the next call —
  even immediately after — starts a new one. It defaults to
  `singleKeyProvider`, so all concurrent calls on a receiver share
  regardless of arguments. Use it to collapse a burst of identical
  concurrent calls without changing how often the method runs over time.
- `memoize` clears the execution only on rejection; a successful one stays
  recorded and is returned to every later caller without running the method
  again. It defaults to `firstArgumentKeyProvider`, so calls are cached per
  first argument — a method with no arguments behaves like a singleton
  automatically. Pass `keyProvider: singleKeyProvider` to memoize the whole
  method regardless of arguments instead.

```ts
class ShardedConnectionPool {
  @ExecutionPolicy.memoize()
  async connect(shardId: string): Promise<Connection> {
    return openConnection(shardId);
  }
}
```

Both also accept a custom `keyProvider`, which may be synchronous or
asynchronous — for example, looking up which shard a call belongs to before
deciding whether it joins an existing connection. `keyProvider` is called
with the wrapped function's own arguments, not a wrapping context object —
the same shape as the extractor functions used elsewhere in this ecosystem
(e.g. an `EventExtractor`) — so there's nothing to unwrap:

```ts
class UserConnectionPool {
  @ExecutionPolicy.memoize({
    keyProvider: async (userId: string) => resolveShardId(userId),
  })
  async connect(userId: string): Promise<Connection> {
    return openConnection(await resolveShardId(userId));
  }
}
```

A synchronous `keyProvider` (including both defaults) preserves the same
sharing behavior either policy has always had: concurrent callers sharing
an execution get the literal same Promise. An asynchronous `keyProvider`
still guarantees a single execution and an equal-valued result for every
caller, but each caller gets its own Promise wrapper rather than a shared
reference, since the key has to be awaited before the policy can decide
whether an invocation joins an existing execution.

The decorator factories are called before the decorated method is known, so
`keyProvider`'s parameters can't be inferred from it automatically — by
default they're typed `unknown[]`. Supply the method's argument tuple
explicitly to type them against it instead of casting inside `keyProvider`:

```ts
class EventHandler {
  @ExecutionPolicy.memoize<[UserEvent]>({
    keyProvider: event => event.userId, // event: UserEvent, not unknown
  })
  async handle(event: UserEvent): Promise<void> {
    /* ... */
  }
}
```

### Writing a custom policy

Every policy — including `retryable`, `shared`, and `memoize` — is a small
class extending `AbstractExecutionPolicy`, which preserves the wrapped
function's type; a policy only implements `createExecutor`, returning its
replacement:

```ts
import {
  AbstractExecutionPolicy,
  type AnyAsyncMethod,
} from '@sektek/utility-belt';

class LoggingExecutionPolicy extends AbstractExecutionPolicy {
  protected createExecutor(method: AnyAsyncMethod): AnyAsyncMethod {
    return function (this: unknown, ...args: unknown[]) {
      console.log('calling', method.name, args);
      return method.apply(this, args);
    };
  }
}

const loggingPolicy = new LoggingExecutionPolicy();
const loggedRun = loggingPolicy.wrap(async () => {
  /* ... */
});

class Subject {
  @ExecutionPolicy.decorate(loggingPolicy)
  async run(): Promise<void> {
    /* ... */
  }
}
```

`shared` and `memoize` are themselves built on a second base class,
`AbstractSharedExecutionPolicy`, which handles resolving `keyProvider` and
coalescing/retaining executions; a subclass only implements `retain`,
deciding whether a settled execution stays recorded for future callers.

## Installation

```sh
npm install @sektek/utility-belt
```
