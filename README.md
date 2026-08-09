# Utility Belt

General utilities to be used within @sektek projects

## Execution policies

`ExecutionPolicy` provides composable decorators for asynchronous methods.

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
deciding whether it joins an existing connection:

```ts
class UserConnectionPool {
  @ExecutionPolicy.memoize({
    keyProvider: async ({ args }) => resolveShardId(args[0]),
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

## Installation

```sh
npm install @sektek/utility-belt
```
