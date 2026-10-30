# Utility Belt

Utility Belt provides reusable, composable TypeScript building blocks for resolving values, making decisions, coordinating work, and managing services. Rather than a collection of array or string shortcuts, it focuses on small behavioral contracts that you can combine or adopt individually.

## What can you build?

| Need | Start with |
| --- | --- |
| Resolve values or dependencies with caching, fallbacks, or timeouts | [Providers](docs/reference.md#providers) |
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

### Reuse a resource without changing its consumer

```ts
import { singleton } from '@sektek/utility-belt';

let connections = 0;

const resource = singleton(async () => {
  connections += 1;
  return { name: 'shared resource' };
});

const first = resource.get();
const second = resource.get();

const [a, b] = await Promise.all([first, second]);

console.log(a === b); // true
console.log(connections); // 1
```

A provider is a contract for obtaining a value, not a configuration-specific abstraction. Consumers can depend on that contract while implementations retrieve, transform, cache, time-limit, or fall back to other sources. See [provider composition and fallback examples](docs/reference.md#providers).

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

For example, the same consumer can accept either a function or an object with a `get` method:

```ts
import { ProviderComponent, ProviderFn, getComponent } from '@sektek/utility-belt';

class Greeter {
  #getName: ProviderFn<string>;

  constructor(nameProvider: ProviderComponent<string>) {
    this.#getName = getComponent(nameProvider, 'get');
  }

  async greet() {
    return `Hello, ${await this.#getName()}!`;
  }
}

const fromFunction = new Greeter(() => 'Ada');
const fromObject = new Greeter({ get: () => 'Grace' });

console.log(await fromFunction.greet()); // Hello, Ada!
console.log(await fromObject.greet()); // Hello, Grace!
```

Consumers depend on behavior, not a particular class. You can start with a function, substitute a provider that looks up a resource, and then wrap it with caching or fallback behavior without rewriting the consumer. That flexibility adds indirection, so prefer the smallest composition that solves a real problem. The [core contracts and component resolution reference](docs/reference.md#core-concepts) explains the types and method resolution rules.

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
