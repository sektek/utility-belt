# Utility Belt

General utilities to be used within @sektek projects: small, composable
building blocks for providers, predicates, execution strategies, HTTP,
logging, service lifecycles and collections.

## Installation

```sh
npm install @sektek/utility-belt
```

The package is ESM only and everything is exported from the package root:

```ts
import { getComponent, FallbackProvider, allOf } from '@sektek/utility-belt';
```

## Contents

- [Core concepts](#core-concepts)
  - [Components and `getComponent`](#components-and-getcomponent)
  - [Interface types](#interface-types)
- [Providers](#providers)
- [Predicates](#predicates)
- [Execution strategies](#execution-strategies)
- [Logging](#logging)
- [Components and services](#components-and-services)
- [HTTP](#http)
- [Collections and iteration](#collections-and-iteration)
- [Other utilities](#other-utilities)

## Core concepts

### Components and `getComponent`

Nearly every dependency in this library is a _component_: it can be supplied
either as an object with a named method **or** as a plain function. The
`Component<T, K>` type describes that union, and `getComponent` resolves
either form to a single callable function (binding methods to their object).

```ts
import {
  ProviderComponent,
  ProviderFn,
  getComponent,
} from '@sektek/utility-belt';

class Greeter {
  #getName: ProviderFn<string>;

  constructor(opts: { nameProvider: ProviderComponent<string> }) {
    this.#getName = getComponent(opts.nameProvider, 'get');
  }

  async greet() {
    return `Hello, ${await this.#getName()}!`;
  }
}

// Both are valid:
new Greeter({ nameProvider: () => 'World' });
new Greeter({ nameProvider: { get: () => 'World' } });
```

`getComponent(obj, fnNames, opts?)`:

- `fnNames` is a method name, or a list of names tried in order.
- If `obj` has none of the named methods but is itself a function, it is
  returned as is.
- Otherwise `opts.default` or `opts.defaultProvider` (a sync provider) is
  consulted, and finally an `InvalidComponentError` is thrown. `opts.name`
  and `opts.errorMessage` customise the error message.

```ts
const getName = getComponent<ProviderComponent<string>, () => string>(
  undefined,
  'get',
  { default: () => 'anonymous' },
);
```

### Interface types

Each interface has three related types, e.g. for `Provider`:

| Type                      | What it is                                    |
| ------------------------- | --------------------------------------------- |
| `ProviderFn<R, T>`        | The bare function signature                   |
| `Provider<R, T>`          | An object with a `get` method of that type    |
| `ProviderComponent<R, T>` | Either of the above, for use in options types |

| Interface                             | Method                                 | Notes                                                   |
| ------------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| `Provider<R, T = void>`               | `get(arg)`                             | May be sync or async                                    |
| `SyncProvider<R, T = void>`           | `get(arg)`                             | Must be synchronous (e.g. for constructors)             |
| `OptionalProvider<R, T = void>`       | `get(arg)`                             | May resolve to `undefined`                              |
| `Predicate<T = void>`                 | `test(value)`                          | Resolves to a boolean                                   |
| `SyncPredicate<T = void>`             | `test(value)`                          | Synchronous variant                                     |
| `Processor<I, O>`                     | `process(input)`                       | Transforms a value                                      |
| `Command<T, R>`                       | `execute(arg)`                         | Performs an action                                      |
| `Mutator<T, K>`                       | `set(key, value)`                      |                                                         |
| `ErrorHandler<T>`                     | `handle(error, ctx?)`                  |                                                         |
| `ExecutionStrategy<T>`                | `execute(fns, ...args)`                | See [Execution strategies](#execution-strategies)       |
| `Collector<T>`                        | `add(item)`                            | Named `add` so a `Set` qualifies                        |
| `IterableProvider<R, T>`              | `values(arg)`                          | Named `values` so arrays, sets and maps qualify         |
| `Collection<T>`                       | `add`, `values`, `clear`               | `Collector` + `IterableProvider`                        |
| `Store<T, K = string>`                | `get/set/delete/has/keys/values/clear` | Key/value storage; a `Map` is close to compatible       |
| `Repository<T, K = string>`           | `get/save/delete/has/includes`         | Entity storage                                          |
| `Builder<T>`                          | `create(overrides)`                    | See [`ObjectBuilder`](#objectbuilder)                   |
| `Startable` / `Stoppable` / `Service` | `start()` / `stop()` / both            | See [Components and services](#components-and-services) |
| `Named`                               | `name`                                 | `{ name: string }`                                      |
| `EventEmittingService<Events>`        | `on`, `emit`                           | Typed event emitter contract                            |
| `Constructor<T>`                      | `new (...args)`                        |                                                         |

Only interfaces with a single "action" method have a `*Component` type.

## Providers

A provider produces a value, optionally from an argument. The classes below
decorate or combine other providers; every one accepts its inner providers as
components (object or function).

| Class                           | Behaviour                                                                                                                                          |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FallbackProvider`              | Wraps an `OptionalProvider`; when it yields `undefined`, uses `defaultValue` or `defaultValueProvider` instead                                     |
| `ChainedOptionalProvider`       | Tries a list of optional providers in order; returns the first defined value, else `undefined`                                                     |
| `ChainedProvider`               | `ChainedOptionalProvider` plus a `FallbackProvider` default, so it always yields a value                                                           |
| `DelegatingProvider`            | A `selector` picks a key; the matching provider in `delegates` is invoked, else the required `default`                                             |
| `DelegatingOptionalProvider`    | Like `DelegatingProvider`, but `default` is optional and the result may be `undefined`                                                             |
| `ProcessingProvider`            | Runs a provider's result through a `Processor`                                                                                                     |
| `SingletonProvider`             | Calls the inner provider once and caches the result (concurrent calls share one invocation); `reset()` clears the cache                            |
| `TimeSensitiveProvider`         | Rejects with `Provider timed out` if the inner provider takes longer than `timeout` ms                                                             |
| `TimeSensitiveOptionalProvider` | Resolves to `undefined` on timeout instead of rejecting                                                                                            |
| `EnvVarProvider`                | Reads an environment variable; throws if it is not set                                                                                             |
| `EnvVarOptionalProvider`        | Reads an environment variable; `undefined` if it is not set                                                                                        |
| `EnvVarBooleanProvider`         | Reads an environment variable as a boolean (`"true"`, case-insensitive); `defaultValue` (default `false`) when unset. Also usable as a `Predicate` |

```ts
import {
  ChainedProvider,
  EnvVarOptionalProvider,
  FallbackProvider,
  TimeSensitiveOptionalProvider,
  HttpOptionalProvider,
  singleton,
} from '@sektek/utility-belt';

// Use PORT if set, otherwise 3000.
const port = new FallbackProvider({
  provider: new EnvVarOptionalProvider({ variableName: 'PORT' }),
  defaultValue: '3000',
});
await port.get(); // '3000' or the value of $PORT

// Try the remote config for up to a second, then the environment, then a default.
const region = new ChainedProvider({
  providers: [
    new TimeSensitiveOptionalProvider({
      provider: new HttpOptionalProvider({
        url: 'https://config.example/region',
      }),
      timeout: 1000,
    }),
    new EnvVarOptionalProvider({ variableName: 'REGION' }),
  ],
  defaultValue: 'us-east-1',
});

// Create an expensive resource once, on first use.
const db = singleton(() => connectToDatabase());
await db.get(); // connects
await db.get(); // same instance
await db.reset(); // next get() connects again
```

`FallbackProvider.wrap(provider, defaultValue)`, `SingletonProvider.wrap(provider)`
and the `singleton(provider)` helper are shorthand for the constructors.

`DelegatingProvider` is handy for choosing an implementation from the
argument:

```ts
const rate = new DelegatingProvider<number, { currency: string }>({
  selector: ctx => ctx.currency,
  delegates: {
    USD: () => 1,
    EUR: () => fetchEurRate(),
  },
  default: () => 0,
});
await rate.get({ currency: 'EUR' });
```

## Predicates

A predicate answers a yes/no question about a value. All predicates are
async-friendly and short-circuit.

| Class / helper                   | Result                                                                                                |
| -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `AllPredicate` / `allOf(...)`    | `true` only if every predicate passes (and there is at least one)                                     |
| `AnyPredicate` / `anyOf(...)`    | `true` if any predicate passes                                                                        |
| `NonePredicate` / `noneOf(...)`  | `true` if no predicate passes                                                                         |
| `NegatedPredicate` / `negate(p)` | Inverts a single predicate                                                                            |
| `DelegatingPredicate`            | A `selector` picks a key and the matching predicate in `delegates` is used, else `default` (`reject`) |
| `AcceptPredicate` / `accept`     | Always `true`                                                                                         |
| `RejectPredicate` / `reject`     | Always `false`                                                                                        |

```ts
import { allOf, anyOf, negate } from '@sektek/utility-belt';

const isAdult = (user: User) => user.age >= 18;
const isMember = { test: async (user: User) => await lookupMembership(user) };

const canEnter = allOf(
  isAdult,
  anyOf(isMember, (u: User) => u.hasTicket),
);
const isMinor = negate(isAdult);

await canEnter.test(user);
```

With no predicates, `allOf()` and `anyOf()` are `false` and `noneOf()` is
`true`.

## Execution strategies

An execution strategy decides _how_ a set of functions is run. Components that
fan work out accept an `ExecutionStrategyComponent`, so callers can choose the
policy.

| Export                      | Behaviour                                                                                                                                 |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `serialExecutionStrategy`   | A function; runs each function in turn, stopping at the first error                                                                       |
| `ParallelExecutionStrategy` | Runs functions concurrently (optional `maxConcurrency`). Always lets every function finish, then throws an `ExecutionError` if any failed |
| `parallelExecutionStrategy` | A function using a default (unbounded) `ParallelExecutionStrategy`                                                                        |
| `RoundRobinStrategy`        | Each call to `execute` runs only the _next_ function in the list, cycling. Buffers the whole iterable first                               |
| `ExecutionError`            | An `AggregateError` holding every failure (`error.errors`)                                                                                |

```ts
import {
  ExecutionError,
  ParallelExecutionStrategy,
  serialExecutionStrategy,
} from '@sektek/utility-belt';

const handlers = [notifyEmail, notifySlack, notifyWebhook];

await serialExecutionStrategy(handlers, message);

const parallel = new ParallelExecutionStrategy({ maxConcurrency: 2 });
try {
  await parallel.execute(handlers, message);
} catch (error) {
  if (error instanceof ExecutionError) {
    console.error(`${error.errors.length} handlers failed`);
  }
}
```

The `fns` argument can be any iterable or async iterable, and the remaining
arguments are passed to every function.

## Logging

`Logger` is a small structured-logging interface (`log`, `error`, `warn`,
`info`, `debug`, the `is*Enabled()` checks, and `child(context)`) that is easy
to satisfy with Winston, Pino or similar.

Libraries should not take a `Logger` directly. They take a `LoggerProvider`,
which hands out a logger for a given context:

| Export                  | Description                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `LoggerProvider<T>`     | A `SyncProvider<Logger, T>` with `with(context, ...contextProviders)` to derive a provider with extra context |
| `DefaultLoggerProvider` | Builds child loggers from a base `Logger`, merging static `context` with the results of `contextProviders`    |
| `NullLogger`            | A `Logger` where every method is a no-op                                                                      |
| `NullLoggerProvider`    | A `LoggerProvider` that always returns the shared `NullLogger`                                                |

```ts
import { DefaultLoggerProvider } from '@sektek/utility-belt';

const loggerProvider = new DefaultLoggerProvider<Request>({
  logger: myBaseLogger,
  context: { service: 'api' },
  contextProviders: [req => ({ requestId: req.id })],
});

loggerProvider.get(request).info('handling request');
// -> myBaseLogger.child({ service: 'api', requestId: '…' }).info(...)

const adminLogger = loggerProvider.with({ scope: 'admin' }); // original unchanged
```

`NullLogger` and `NullLoggerProvider` are the default wherever a logger is
optional, so components never need to check for one.

## Components and services

### `AbstractComponent`

A base class (an `EventEmitter`) that gives subclasses a stable `name` and a
logger. Options: `name` (defaults to a generated `ClassName#N`) and
`loggerProvider` (defaults to `NullLoggerProvider`).

```ts
class Mailer extends AbstractComponent<{ to: string }> {
  send(to: string) {
    this.logger({ to }).info('sending mail');
    this.emit('mail:sent', to);
  }
}
```

### `AbstractService` and `ProcessManager`

`AbstractService` extends `AbstractComponent` with no-op `start()` and
`stop()` methods for subclasses to override. On construction it registers
itself with a `ProcessManager`, passed as `processManager` or else created
internally.

`ProcessManager` starts and stops registered `Startable`/`Stoppable` objects
through an execution strategy (serial by default), with optional per-service
`maxStartWaitMs` / `maxStopWaitMs` deadlines. A manager with no parent
registers SIGTERM/SIGINT listeners so services stop on shutdown, and removes
them when nothing is left to stop.

```ts
import {
  AbstractService,
  ParallelExecutionStrategy,
  ProcessManager,
} from '@sektek/utility-belt';

class Worker extends AbstractService {
  async start() {
    /* open connections */
  }
  async stop() {
    /* drain and close */
  }
}

const manager = new ProcessManager({
  name: 'app',
  executionStrategy: new ParallelExecutionStrategy(),
  maxStartWaitMs: 5000,
  maxStopWaitMs: 3000,
});

new Worker({ processManager: manager });
new Worker({ processManager: manager });

await manager.start();
// SIGTERM or SIGINT now calls manager.stop(), or call it yourself:
await manager.stop();
```

## HTTP

Built on the platform `fetch` API.

| Export                             | Description                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `HttpOperator`                     | Performs a request with `perform(arg)` and returns the `Response`. Throws on non-2xx. Emits `request:created`, `request:error`, `response:received` and `response:error` |
| `HttpProvider`                     | A `Provider` that performs a GET and deserializes the response (JSON by default). Failures are wrapped as `Unable to obtain resource: …`                                 |
| `HttpOptionalProvider`             | Like `HttpProvider`, but resolves to `undefined` if the request fails (a response that cannot be deserialized still throws)                                              |
| `CompositeHeadersProvider`         | Merges the headers of several `HeadersProvider`s                                                                                                                         |
| `contentTypeHeadersProvider(type)` | Returns a headers provider function with a fixed `Content-Type`                                                                                                          |

`HttpOperator` options: `url` or `urlProvider`, `method` (`GET` by default),
`headersProvider`, `contentType` (`application/json`), `bodySerializer`
(`JSON.stringify` for POST/PUT/PATCH, none for GET/DELETE) and `timeout` in
milliseconds. `HttpProvider` and `HttpOptionalProvider` take the same
options, plus `responseDeserializer` and an existing `httpOperator`.

Because `url`, headers and the body are derived from the argument you pass,
one instance can serve many requests:

```ts
import { HttpOperator, HttpProvider } from '@sektek/utility-belt';

const getUser = new HttpProvider<User, string>({
  urlProvider: id => `https://api.example/users/${id}`,
  headersProvider: () => ({ Authorization: `Bearer ${token}` }),
  timeout: 5000,
});
const user = await getUser.get('42');

const createUser = new HttpOperator<NewUser>({
  url: 'https://api.example/users',
  method: 'POST',
});
createUser.on('response:error', (arg, response, error) => {
  console.error(error.message);
});
const response = await createUser.perform({ name: 'Ada' });
```

## Collections and iteration

### `ArrayCollection`

A `Collection<T>` backed by an array: `add(item)`, `values()`, `clear()`.

### `Queue`

An async, in-memory FIFO queue that is an `AsyncIterable`. Producers `add`
items; a single consumer iterates with `for await`. The iteration waits for
new items until the queue is stopped.

```ts
import { Queue } from '@sektek/utility-belt';

const queue = new Queue<string>({ maxSize: 100 });

await queue.add('a');
await queue.add('b');

// consumer
for await (const item of queue) {
  console.log(item);
}

// elsewhere: stop accepting items and wait for the queue to drain
await queue.stop();
```

| Option                                   | Default         | Meaning                                                          |
| ---------------------------------------- | --------------- | ---------------------------------------------------------------- |
| `maxSize`                                | `Infinity`      | Capacity. `add` waits while the queue is full                    |
| `maxWaitAdd`                             | `Infinity`      | How long `add` waits for space before throwing                   |
| `maxWaitStop`                            | `5000`          | How long `stop()` waits for the queue to drain before throwing   |
| `sleepDuration`                          | `100`           | Polling interval (ms) when waiting on an empty or full queue     |
| `sleepDurationAdd` / `sleepDurationStop` | `sleepDuration` | Overrides for the add and stop polling intervals                 |
| `stopOnEmpty`                            | `false`         | Stop automatically once the queue is empty, ending the iteration |

Only one iteration can be active at a time. `add` throws once the queue is
stopped, until `start()` is called again.

### `take`

An async generator that yields up to `limit` items from any iterable or async
iterable, after skipping `offset` items.

```ts
for await (const item of take(queue, 10, 20)) {
  // items 20-29
}
```

### `ObjectBuilder`

A `Builder<T>` for objects whose properties may be static values or
functions (including async ones). `create(overrides)` produces a deep-cloned
object; its pieces are:

- `with(defaults)` returns a new builder with more defaults.
- `from(object)` returns a new builder whose defaults also include the
  `copyKeys` picked from `object`.
- `create(overrides)` resolves every property. An override function is
  called with no arguments; a default function is called with the
  override object for that property; two plain objects are deep-merged;
  otherwise the override wins over the default.
- `creator` is `create` pre-bound, for handing out as a plain function.

```ts
import { ObjectBuilder } from '@sektek/utility-belt';

type Job = { id: string; priority: number; options: { retries: number } };

const jobs = new ObjectBuilder<Job>({
  defaults: {
    id: () => crypto.randomUUID(),
    priority: 5,
    options: { retries: 3 },
  },
});

await jobs.create({ priority: 1 });
// { id: '…', priority: 1, options: { retries: 3 } }

await jobs.create({ options: { retries: 0 } });
// options is deep-merged with the default
```

## Other utilities

| Export                                      | Description                                                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `sleep(ms)`                                 | A promise that resolves after `ms`; the result has `cancel()` to resolve it early and clear the timer |
| `noOp`                                      | A function that does nothing                                                                          |
| `isA<T>(obj, fnName)`                       | Type guard: `obj` is a non-primitive with a function named `fnName`                                   |
| `isFunction(value)`                         | Type guard for functions                                                                              |
| `isPrimitive(value)`                        | `true` if `value` is not an object (or function)                                                      |
| `isError(value)`                            | Type guard for `Error` instances                                                                      |
| `isNamed(value)`                            | Type guard for objects with a string `name`                                                           |
| `isStartable(value)` / `isStoppable(value)` | Type guards for objects with a `start` / `stop` method                                                |
| `InvalidComponentError`                     | Thrown by `getComponent`; exposes the offending `component`                                           |

```ts
const nap = sleep(60_000);
process.once('SIGTERM', () => nap.cancel());
await nap;
```

## License

MIT
