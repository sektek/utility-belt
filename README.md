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

`shared` and `single` both let concurrent calls on the same receiver and key
reuse one execution instead of starting duplicate work. They differ in what
happens once that execution settles:

- `shared` always clears it, so the next call — even immediately after —
  starts a new execution. Use it to collapse a burst of identical concurrent
  calls without changing how often the method runs over time.
- `single` clears it only on rejection. A successful execution stays
  recorded and is returned to every later caller without running the method
  again — useful for one-time initialization, such as opening a connection.

Both accept a `keyProvider` to share by something other than the whole
method — for example, coalescing per shard instead of per instance. It may
be synchronous or asynchronous, e.g. looking up which shard a call belongs
to before deciding whether it joins an existing connection:

```ts
class ShardedConnectionPool {
  @ExecutionPolicy.single({
    keyProvider: async ({ args }) => resolveShardId(args[0]),
  })
  async connect(userId: string): Promise<Connection> {
    return openConnection(await resolveShardId(userId));
  }
}
```

A synchronous `keyProvider` (including the default) preserves today's exact
behavior: concurrent callers sharing an execution get the literal same
Promise. An asynchronous `keyProvider` still guarantees a single execution
and an equal-valued result for every caller, but each caller gets its own
Promise wrapper rather than a shared reference, since the key has to be
awaited before the policy can decide whether an invocation joins an
existing execution.

## Installation

```sh
npm install @sektek/utility-belt
```
