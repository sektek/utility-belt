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
    delay: ({ attempt }) => attempt * 100,
    retryIf: ({ error }) => error instanceof Error,
  })
  async load(): Promise<string> {
    return 'resource';
  }
}
```

Decorators are applied from the method outward. Here, `retryable` wraps
`load` first and `shared` wraps the complete retry sequence, so concurrent
callers share one sequence and its final outcome.

## Installation

```sh
npm install @sektek/utility-belt
```
