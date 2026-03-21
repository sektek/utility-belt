# CLAUDE.md — @sektek/utility-belt

Foundational library providing providers, predicates, execution strategies, HTTP utilities, collections, and type interfaces used across the monorepo.

## Commands

```bash
npm run build        # Compile (tsc -p tsconfig.build.json)
npm test             # Run all tests (mocha + tsx/esm)
npm run test:cover   # Coverage via c8

# Single test file:
npx mocha --import tsx/esm src/path/to/file.spec.ts
```

## Source layout

```
src/
  types/           # All TypeScript interfaces (Provider, Store, Predicate, etc.)
  execution-strategies/  # Serial, Parallel, RoundRobin
  predicates/      # All, Any, None, Negate
  http/            # HttpOperator, HttpProvider, header/body utilities
  *.ts             # Everything else (providers, collections, utilities)
  *.spec.ts        # Tests co-located with source
```

## Modules

### Types (`src/types/`)

Core interfaces — no implementations, just contracts:

| Interface | Purpose |
|-----------|---------|
| `Provider<R, T>` | Async provider; also accepts a plain function |
| `SyncProvider<R, T>` | Sync-only variant |
| `OptionalProvider<R, T>` | May return `undefined` |
| `Predicate<T>` | Async `test(item): Promise<boolean>` |
| `SyncPredicate<T>` | Sync-only predicate |
| `ExecutionStrategy<T>` | Executes a list of functions |
| `Store<T, K>` | `get/set/delete/has/keys/values/clear` |
| `Repository<T, K>` | `save/delete/get/has/includes` |
| `Collection<T>` | `Collector + IterableProvider + clear` |
| `Collector<T>` | Single `add(item)` method |
| `IterableProvider<R, T>` | Returns `Iterable` or `AsyncIterable` via `values()` |
| `Processor<I, O>` | `process(input): Promise<O>` |
| `Logger` | Structured logging: `debug/info/warn/error` + context |
| `LoggerProvider<T>` | `SyncProvider<Logger>` with `with(ctx)` |
| `Service` | `Startable + Stoppable` |
| `EventEmittingService<T>` | Typed `EventEmitter` interface |
| `Component<T, K>` | Utility type extracting a method signature |

### Provider implementations

| Class | Behaviour |
|-------|-----------|
| `DefaultProvider` | Wraps a provider with a fallback default; throws if neither provides a value |
| `SingletonProvider` | Calls inner provider once; caches result; `reset()` clears cache |
| `TimeSensitiveProvider` | Rejects with "Provider timed out" if inner provider is too slow |
| `TimeSensitiveOptionalProvider` | Returns `undefined` on timeout instead of throwing |
| `ProcessingProvider` | Chains `Provider → Processor` |

All have static `wrap()` factory methods. `SingletonProvider` also exports `singleton()` helper.

### Execution strategies (`src/execution-strategies/`)

All implement `ExecutionStrategy<T>`.

| Class | Behaviour |
|-------|-----------|
| `SerialExecutionStrategy` | Sequential, stops on first error |
| `ParallelExecutionStrategy` | Concurrent; optional `maxConcurrency`; throws `ExecutionError` (AggregateError) if any fail |
| `RoundRobinStrategy` | Cycles through functions on each call |

`ExecutionError` extends `AggregateError` and carries all errors from a parallel run.

### Predicates (`src/predicates/`)

All implement `Predicate<T>` (async `test` method) and use short-circuit evaluation.

| Class | Helper function | Behaviour |
|-------|-----------------|-----------|
| `AllPredicate` | `allOf(...predicates)` | true iff ALL pass |
| `AnyPredicate` | `anyOf(...predicates)` | true iff ANY passes |
| `NonePredicate` | `noneOf(...predicates)` | true iff NONE pass |
| `NegatedPredicate` | `negate(predicate)` | inverts single predicate |

All expose a static `wrap()` factory.

### HTTP utilities (`src/http/`)

**Types:** `HeadersProvider`, `UrlProvider`, `BodySerializer`, `ResponseDeserializer`, `HttpEventService`

| Class/Function | Purpose |
|---------------|---------|
| `HttpOperator` | Core HTTP client (EventEmitter); supports GET/POST/PUT/PATCH/DELETE; timeout via `AbortSignal.timeout()`; validates 2xx; emits `request:created`, `request:error`, `response:received`, `response:error` |
| `HttpProvider` | Wraps `HttpOperator` + `ResponseDeserializer`; defaults to `response.json()` |
| `HttpOptionalProvider` | Like `HttpProvider` but returns `undefined` on request error |
| `CompositeHeadersProvider` | Merges headers from multiple `HeadersProvider` instances |
| `ContentTypeHeadersProvider` | Factory returning a fixed `Content-Type` header provider |

### `getComponent` utility

```ts
getComponent(obj, fnNames, opts)
```

The mechanism behind the `*Component` pattern used throughout the monorepo. It allows any injectable dependency to be supplied as either a class instance (or plain object) with a named method, or as a plain function — the caller never needs to know which form was provided.

```ts
// These are both valid for a SerializerComponent<T>:
new RedisStore({ valueSerializer: mySerializerInstance }); // object with .serialize()
new RedisStore({ valueSerializer: (v) => JSON.stringify(v) }); // plain function
```

`getComponent` resolves both forms to a single callable function, binding methods to their source object. Supports multiple fallback method names, an optional default value or provider, and custom error messages.

### Other utilities

| Export | Description |
|--------|-------------|
| `isA<T>(obj, fnName)` | Type guard: checks obj has method `fnName` |
| `isFunction(value)` | Type guard for functions |
| `isPrimitive(value)` | True if value is not an Object |
| `noOp()` | Empty void function |
| `take(source, limit, offset?)` | Async generator: takes N items from any iterable |
| `NullLogger` | No-op `Logger` implementation |
| `NullLoggerProvider` | Singleton provider always returning `NullLogger` |

### Collections

**`ArrayCollection<T>`** — Simple `Collection<T>` backed by an array: `add`, `clear`, `values()`.

**`Queue<T>`** — Async queue implementing `Collector` and `AsyncIterable`. Options: `maxSize`, `maxWaitAdd`, `maxWaitStop`, `sleepDuration`, `stopOnEmpty`. Internally uses a linked list. Prevents concurrent iteration.

**`ObjectBuilder<T>`** — Fluent builder: static defaults + dynamic provider functions. Key methods: `from(obj)` copy-from, `with(defaults)` merge-defaults, `create(input?)` build, `.creator` bound accessor. Uses lodash deep merge/clone.

## Testing conventions

- Tests live in `*.spec.ts` files co-located with source
- Mocha BDD (`describe`/`it`), Chai assertions, `chai-as-promised` for async
- Sinon for stubs/spies; `nock` for HTTP mocking
- `NullLogger` / `NullLoggerProvider` used in tests needing a logger

## Key constraints

- No new dependencies without explicit approval
- ESM only (`"type": "module"`)
- TypeScript decorators enabled (`experimentalDecorators`, `emitDecoratorMetadata`)
- `lodash` is available — prefer it over reimplementing utility logic
