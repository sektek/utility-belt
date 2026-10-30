# Utility Belt

Utility Belt provides reusable, composable TypeScript building blocks for resolving values, making decisions, coordinating work, and managing services. Rather than a collection of array or string shortcuts, it focuses on small behavioral contracts that you can combine or adopt individually.

## What can you build?

| Need | Start with |
| --- | --- |
| Resolve configuration with fallbacks or timeouts | [Providers](docs/reference.md#providers) |
| Combine authorization or validation decisions | [Predicates](docs/reference.md#predicates) |
| Control serial, parallel, or bounded-concurrency execution | [Execution strategies](docs/reference.md#execution-strategies) |
| Start and stop services as a group | [ProcessManager](docs/reference.md#abstractservice-and-processmanager) |
| Compose HTTP operations, logging, and collections | [HTTP](docs/reference.md#http), [logging](docs/reference.md#logging), [collections](docs/reference.md#collections-and-iteration) |

## Installation

```sh
npm install @sektek/utility-belt
```

The package uses ESM and exports its public API from the package root.

## Quick examples

### Resolve a setting with a fallback

```ts
import { EnvVarOptionalProvider, FallbackProvider } from '@sektek/utility-belt';

const port = new FallbackProvider({
  provider: new EnvVarOptionalProvider({ variableName: 'PORT' }),
  defaultValue: '3000',
});

console.log(await port.get()); // PORT, or '3000' when unset
```

Providers can also be chained, timed out, or cached without changing the consumer. See the [remote configuration → environment → default example](docs/reference.md#providers).

### Combine decisions

```ts
import { allOf, anyOf } from '@sektek/utility-belt';

type Visitor = { age: number; hasTicket: boolean; isMember: boolean };

const canEnter = allOf(
  (visitor: Visitor) => visitor.age >= 18,
  anyOf(
    (visitor: Visitor) => visitor.isMember,
    (visitor: Visitor) => visitor.hasTicket,
  ),
);

console.log(await canEnter.test({ age: 21, hasTicket: true, isMember: false }));
```

### Choose an execution policy

```ts
import { ParallelExecutionStrategy } from '@sektek/utility-belt';

const strategy = new ParallelExecutionStrategy({ maxConcurrency: 2 });
const jobs = [
  async () => console.log('email'),
  async () => console.log('webhook'),
  async () => console.log('audit'),
];

await strategy.execute(jobs);
```

Parallel execution waits for all tasks to finish and aggregates failures. Use [serial execution](docs/reference.md#execution-strategies) when ordering or early failure is required.

## The shared mental model

A **Provider** obtains a value. A **Predicate** answers a yes/no question. A **Processor** transforms an input. A **Command** performs an action. An **ExecutionStrategy** decides how functions are scheduled. A **Component** contract often accepts either a function or an object with the relevant method.

Consumers depend on behavior, not a particular class. You can start with a function, substitute a provider that fetches remotely, and then wrap it with caching or fallback behavior without rewriting the consumer. That flexibility adds indirection, so prefer the smallest composition that solves a real problem. The [core contracts and component resolution reference](docs/reference.md#core-concepts) explains the types and method resolution rules.

## Design philosophy

Utility Belt favors explicit contracts and small independently useful pieces. Composition reduces repeated wiring and coupling where behavior needs to vary. You can use a single predicate or provider without adopting the rest of the library or the wider SEKTEK ecosystem.

## More capabilities

- [ProcessManager and service lifecycle](docs/reference.md#abstractservice-and-processmanager): coordinate startup and shutdown; understand which manager owns process signal handlers.
- [HTTP](docs/reference.md#http): work with the platform `fetch` API and typed provider wrappers.
- [Logging](docs/reference.md#logging): inject a `LoggerProvider` so components can obtain context-specific loggers.
- [Queue and iteration](docs/reference.md#queue): use an asynchronous FIFO queue with explicit consumer and shutdown behavior.
- [ObjectBuilder and other utilities](docs/reference.md#objectbuilder): compose values and reuse supporting helpers.

## Further documentation

See the [API and behavior reference](docs/reference.md) for detailed contracts, options, defaults, error semantics, examples, and the export catalog. [Synaptik](https://github.com/sektek/synaptik) builds on some of these shared abstractions, but Utility Belt can be used independently.

## License

MIT
