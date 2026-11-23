# Code conventions

This file is the source of truth for code conventions in this repository. Related: [architecture.md](architecture.md)
(package map, layering, production setup) and [tooling.md](tooling.md) (installed tools and versions).

Scope: `apps/*`, `packages/*` and `scripts/*`. `scripts/crawler/` is legacy tooling and is excluded from these rules
(D36). `plan/` is gitignored planning material and may stay in Portuguese.

## 1. One declaration kind per file

Each file holds one kind of declaration, named by its suffix.

| Declaration | File suffix | Location |
|---|---|---|
| Object shape / contract (`interface`) | `*.interface.ts` | package `src/interfaces/` or the module folder |
| Union, alias, mapped type, `z.infer` (`type`) | `*.type.ts` | `src/types/` or the module folder |
| Constants (`SCREAMING_SNAKE`, config objects, lists) | `*.const.ts` | `src/consts/` or the module folder |
| Enum (const object + type + `X_VALUES`) | `*.enum.ts` | **only** `packages/shared/src/enums/` |
| Zod schema | `*.schema.ts` | `packages/shared/src/schemas/` (package-local if private) |
| Error class | `*.error.ts` | `src/errors/` or the module folder |
| Pure function(s) | `*.helper.ts` | `src/helpers/` or the module folder |
| Class | one class per file, suffix by role: `.repository.ts`, `.service.ts`, `.controller.ts`, `.provider.ts`, `.scheduler.ts`, `.cli.ts`, `.methodology.ts`, `.mapper.ts`, `.cache.ts`, `.store.ts`, `.middleware.ts`, `.view.ts` | module folder |
| Route registration | `*.route.ts` (only `defineRoute` lists or mounting) | module folder |
| Drizzle tables | `*.table.ts` (one aggregate per file: table + its `*_translations`) | `packages/db/src/tables/` |
| Tests | `*.test.ts` / `*.test.tsx` next to the code | — |
| Web | `*.page.tsx`, `*.component.tsx`, `*.hook.ts`, `*.query.ts`, `*.store.ts`, `*.fixture.ts`, `*.const.ts` (+ `*.const.en.ts` / `*.const.es.ts` translations) | `apps/web/src/modules/<module>/`, `apps/web/src/shared-ui/` |

Allowed exceptions:
- React `*.component.tsx` / `*.page.tsx` files may declare their own `Props` interface.
- Test files may declare local fixtures.
- `*.table.ts`, `*.seed.ts` and `*.config.ts` may export constants.
- `index.ts` barrels exist only at package roots. Apps import files directly.

## 2. Base classes per role

Inherit from the base of your role instead of re-implementing its plumbing.

| Role | Base class (file) | What a subclass gets |
|---|---|---|
| Write repository | `BaseRepository` (`packages/db/src/repositories/base.repository.ts`) | The only writer: `insert`, `update`, `softDelete`, `restore`, `ensure`, `increment`, `audit`, `transaction`, with versioning (`entity_versions`) and audit logs. Used as is (not subclassed) through `ctx.deps.repo`. |
| Read repository | `abstract BaseReadRepository` (`packages/db/src/repositories/base-read.repository.ts`) | `db`, `selectRows<T>(sql)`, `active(table, ...where)` (soft-delete filter), `pageWindow(page, pageSize)` |
| Service | `abstract BaseService` (`apps/server/src/core/base.service.ts`) | Constructor `(ctx: RequestContext)`; `repo`, `db`, `actor`, `audit()`, `transaction()`, `notFound()` |
| Controller | `abstract BaseController` (`apps/server/src/core/base.controller.ts`) | Constructor `(ctx: RequestContext)`; `service(Service)` builds a service for the same request; `user`. Receives the contract's validated input, calls services, returns the contract response. No DB access. |
| Scheduler | `abstract BaseScheduler` (`apps/server/src/core/base.scheduler.ts`) | `name`, `intervalMs`, `tick()`, `start()` / `stop()` / `runOnce()`, unref'd timer, error logging; disabled when the interval is ≤ 0 |
| Mapper | `abstract BaseMapper<Row, Dto>` (`apps/server/src/core/base.mapper.ts`) | `map(row)`, `mapMany(rows)` |
| CLI | `abstract BaseCli` (`packages/db/src/cli/base.cli.ts`) | Env loading, database handle (`db`, `database`), migration, argument parsing (`command`, `flag()`, `list()`), `run()`, closing and exit code (`main()`, `start()`) |
| Ingest provider | `abstract BaseProvider<Opts>` (`packages/ingest/src/providers/base.provider.ts`) | `key`, `parser`, `run(ctx, opts): Promise<string[]>`, `parseOptions()`, `observe()`, `batch()`, `document()`, `fetchJson()` with retries |
| Provider registry | `ProviderRegistry` (`packages/ingest/src/providers/provider.registry.ts`), instance `PROVIDERS` (`packages/ingest/src/providers/providers.const.ts`) | The single provider map used by the CLI (`pnpm ingest`), the job worker and the admin ingestion runner |
| AI provider | `abstract BaseAiProvider` (`packages/ingest/src/enrich/base-ai.provider.ts`) | `provider`, `model`, `generate(prompt, signal)`, `label`, `parseOutput()`; `OllamaProvider` extends it |
| Ranking methodology | `abstract BaseMethodology<Config>` (`packages/ranking/src/core/base.methodology.ts`) | `key`, `version`, `sport`, `outputKind`, `configSchema`, `rankings()`, `compute()`; inherited `parseConfig()`, `rankingDefinitions()`, `calculate()` |

The per-request context every controller and service receives is `RequestContext`
(`apps/server/src/core/request-context.interface.ts`: `deps`, `session`, `actor`, `ipHash`, `locale`).

## 3. Shared placement

- Used by **two or more packages/apps** → `packages/shared` (or `@was/db` when it needs the database).
- Used by several modules **inside one package** → that package's `src/{helpers,consts,interfaces,types,errors}/`
  (in the web app: `apps/web/src/shared-ui/`).
- Used once → next to its only user, still in a file of the right kind.

Enums, Zod schemas, API contracts and pure business rules shared by server and web live **only** in `packages/shared`.

## 4. Reuse-first search

Before creating any function, constant, type, interface, class, enum or schema, search for an existing one. Replace
`<word>` with the concept (for example `sleep`, `retry`, `slug`, `batch`, `chunk`, `wikipedia`):

```bash
grep -rniE "<word>" packages/shared/src packages/*/src/helpers packages/*/src/consts \
  apps/server/src/core apps/server/src/http apps/web/src/shared-ui --include='*.ts' --include='*.tsx' -l
```

If a match fits, use it. If a near match exists, extend it under a generic name instead of adding a variant.
Duplicated code fails `pnpm dup` (threshold 1 %).

## 5. Naming and language

- Files: kebab-case with the kind suffix (`athlete-card.component.tsx`, `catalog.repository.ts`).
- Classes, interfaces and types: PascalCase. Functions and variables: camelCase. Constants: SCREAMING_SNAKE.
- Helpers get generic names (`chunk`, `retryWithBackoff`, `groupBy`), never domain-flavoured duplicates.
- English everywhere: code, identifiers, comments, docs, file names, URL segments, query keys, enum values and test
  names.
- **i18n catalogs are the only place for pt-BR/es text.** Catalogs:
  - web: `apps/web/src/**/<name>.const.ts` (pt-BR source object) with sibling `<name>.const.en.ts` and
    `<name>.const.es.ts`, combined with `defineMessages` and read with `useText`;
  - shared: `packages/shared/src/i18n/` and `packages/shared/src/consts/*-messages.const.ts` (+ `.en.ts` / `.es.ts`);
  - seeded content: `packages/db/src/seeds/content-translations.json`.

  No visible UI string outside a catalog.

## 6. Layering (server)

```
route (*.route.ts)          defineRoute(contract, (input, ctx) => new XController(ctx).method(input))
  │                         path, schemas, access and rate limit come from the shared contract
  ▼
controller (BaseController) validated input → service calls → contract response; never touches the DB
  ▼
service (BaseService)       business rules; writes through repo (BaseRepository), may throw HttpError
  ▼
repository                  BaseRepository (writes) / BaseReadRepository subclasses (reads); never knows HTTP
```

Example: `apps/server/src/modules/athletes/athletes.route.ts` → `athletes.controller.ts`.
Every route list is registered in `apps/server/src/routes.const.ts` (`ALL_ROUTES`).

## 7. How to check

| Check | Command |
|---|---|
| One declaration kind per file (T0.3 rules) | `node scripts/scan/declaration-rules.mjs` (`--details` lists each hit) |
| Mixed declarations | `pnpm scan:mixed` |
| Non-English text outside catalogs | `pnpm scan:language` |
| Format and lint (Biome) | `pnpm lint` |
| Duplication (jscpd, ≤ 1 %) | `pnpm dup` |
| Unused files, exports, dependencies (knip) | `pnpm deadcode` |
| Types and tests | `pnpm typecheck`, `pnpm test` |

ESLint and dependency-cruiser are deferred (they do not support TypeScript 7 yet; see [tooling.md](tooling.md)), so the
layering and import rules are not checked automatically yet.
