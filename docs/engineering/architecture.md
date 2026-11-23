# Architecture

How the repository is split, which package may import which, how a server request is layered, and the target
production setup. Code rules are in [conventions.md](conventions.md); tools in [tooling.md](tooling.md).

## Package map

| Path | Contents | May import |
|---|---|---|
| `packages/shared` (`@was/shared`) | Enums, consts, interfaces, types, Zod schemas, API contracts (`defineContract`), pure business helpers, shared i18n catalogs, SEO helpers, theme tokens | nothing (no Node or React APIs) |
| `packages/db` (`@was/db`) | Drizzle tables (`src/tables/*.table.ts`), migrations (`src/migrations/NNNN_name.sql`), `BaseRepository`, `BaseReadRepository`, seeds, DB CLIs (`BaseCli`) | shared |
| `packages/ingest` (`@was/ingest`) | Providers (`BaseProvider`, `PROVIDERS` registry), safe fetch, parsers, identity resolver, canonical writer, AI enrichment (`BaseAiProvider`), job queue, `collect.ts` orchestrator, CLI `pnpm ingest` | shared, db |
| `packages/ranking` (`@was/ranking`) | Ranking engine, methodologies (`*.methodology.ts` on `BaseMethodology`), registry | shared (currently imports nothing) |
| `apps/server` | Hono app: routes, controllers, services, read repositories, middlewares, auth, schedulers, SSR integration, SEO routes, image proxy | shared, db, ingest, ranking |
| `apps/web` | React + TanStack Router/Query SSR pages (`*.page.tsx`), components, hooks, queries, stores, fixtures, i18n catalogs | shared only |
| `scripts/` | CI scripts, scans, catalog builder, fixture exporters. `scripts/crawler/` is legacy tooling, excluded from the conventions (D36) | — |
| `data/` | Seeds, catalog JSON, review reports, crawler cache (`data/seeds/.cache`, gitignored) | — |
| `plan/` | Planning (gitignored) | — |

```
          apps/web ───────────────┐
                                  ▼
apps/server ──► ingest ──► db ──► shared
     │  └──────────────────►─┘     ▲
     └──► ranking ─────────────────┘
```

Imports only point down the graph: `shared` never imports another workspace package, and the web app never imports
server, db, ingest or ranking code.

## Server layering

```
HTTP request
  │  middlewares: request log → compress → timing
  │               /api/*: secure headers → locale → CORS → body limit → /api/auth/* (Better Auth) → session
  │               pages: slug redirects → SSR (web/web.route.ts, per-request CSP nonce)
  ▼
route         *.route.ts       defineRoute(contract, (input, ctx) => new XController(ctx).method(input))
  │                            access rule → rate limit → params/query/body validated by the contract schemas
  ▼
controller    BaseController   calls services, returns the contract response (checked with contract.response)
  ▼
service       BaseService      business rules; writes only through BaseRepository; throws HttpError
  ▼
repository    BaseRepository (writes, versioning, audit, soft delete) / BaseReadRepository (reads)
  ▼
Postgres (Neon in production, PGlite locally)
```

Rules:
- Controllers never touch the database. Repositories never know HTTP.
- Every write goes through `BaseRepository` (`ctx.deps.repo`), which versions rows, writes audit logs and only
  soft-deletes (a trigger blocks physical `DELETE`).
- Public catalog reads come from an in-memory snapshot (`CatalogCache`), cleared by the repository's `onWrite` hook.
- Page rendering (SSR) runs in the same process; the renderer calls the API in process (`app.fetch`).

## Production architecture (free tier, target)

```
Browser ──HTTPS──► Koyeb free instance (Docker: apps/server dist, SSR + API, one process)
                    │  in-process caches: HtmlCache (anonymous pages), CatalogCache, image LRU
                    │  middlewares: secure headers + CSP nonce, rate limit (Postgres store), session,
                    │               compression, JSON request log
                    ├──TLS───► Neon Postgres (free, sa-east-1, pooled "-pooler" URL)
                    ├──HTTPS─► upload.wikimedia.org (image proxy, allowlisted)
                    └──HTTPS─► Sentry (errors, PII scrubbed)
UptimeRobot ──► health endpoint every 5 min (keeps the instance warm, alerts by e-mail)
GitHub Actions: CI gates, staging (Neon branch + ephemeral app), deploy (manual approval),
                daily pg_dump, monthly restore drill, ZAP, k6, Lighthouse
Owner's machine: pnpm ingest collect (Ollama) ──TLS──► Neon
```

Rules:
- Production never runs crawlers or AI: `INGEST_SCHEDULE_MONTHS=0` and `OLLAMA_URL` unset.
- Raw source payloads are not stored in production (metadata and evidence excerpts only) to stay within the Neon
  1 GB limit; full payloads stay in the owner's local PGlite and cache.
- One process: the in-memory `HtmlCache` and `CatalogCache` are valid. Running more than one instance requires moving
  them to a shared store.
- Health: `/api/health` exists today (database ping). Separate `/healthz` (liveness) and `/readyz` (readiness)
  endpoints are planned.
- Neon storage alert at 80 %.

This is the target; deployment is not set up yet. Today the repository ships a `Dockerfile` and a CI smoke test (see
the root [README](../../README.md) and [BACKEND.md](../../apps/server/BACKEND.md)).
