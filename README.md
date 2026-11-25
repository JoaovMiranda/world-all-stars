# World All Stars

The encyclopedia of the greatest champions of every sport.

## Repository layout

| Path | Contents |
|---|---|
| `apps/web` | React 19 + Vite, TanStack Router/Query (streaming SSR), Tailwind v4. Guide: [`apps/web/FRONTEND.md`](apps/web/FRONTEND.md) |
| `apps/server` | Hono: routes generated from the shared contracts, one module per feature, SSR, SEO, image proxy. Guide: [`apps/server/BACKEND.md`](apps/server/BACKEND.md) |
| `packages/shared` | API contracts, Zod schemas, enums, consts, pure business rules (server and web), i18n, theme tokens |
| `packages/db` | Drizzle tables, migrations, `BaseRepository` / `BaseReadRepository`, seeds, DB CLIs |
| `packages/ingest` | Data ingestion: providers, parsers, identity resolution, canonical writer, optional AI enrichment, CLI `pnpm ingest` |
| `packages/ranking` | Ranking engine and methodologies |
| `scripts/` | CI, scans, catalog and fixture tools. `scripts/crawler/` is legacy tooling, excluded from the conventions |
| `data/` | Seeds, catalog JSON, review reports ([`data/seeds/README.md`](data/seeds/README.md)) |
| `plan/` | Planning material (gitignored) |

Engineering docs:
- [`docs/engineering/conventions.md`](docs/engineering/conventions.md): code conventions (source of truth): file kinds,
  base classes, shared placement, naming and language, layering.
- [`docs/engineering/architecture.md`](docs/engineering/architecture.md): package map and allowed imports, server
  layering, target production architecture.
- [`docs/engineering/tooling.md`](docs/engineering/tooling.md): quality tools and their versions.

## Running locally

Requirements: Node 22+ (CI and the Docker image use Node 26, see `.nvmrc`) and pnpm 11 (`npm i -g pnpm@11.13.0`; Node
26 ships without corepack). No external service is needed: the database is embedded PGlite (`.data/pglite`,
gitignored).

```bash
pnpm install          # monorepo (pnpm workspaces)
pnpm db:seed          # migrate + seed the local database (prototype data needs plan/; idempotent)
pnpm dev              # http://localhost:8787: SSR pages + /api in one process (Hono + Vite middleware, HMR), fixture data
pnpm dev:api          # same, but pages read the real API (VITE_DATA_SOURCE=http; during SSR the API is called in process)
pnpm typecheck        # tsc in every package
pnpm test             # Vitest in every package (server tests use in-memory PGlite; web includes an SSR smoke test)
pnpm build && pnpm start   # apps/web/dist (client + server/entry-server.js) + apps/server/dist/main.js on http://localhost:8787
                           # (production requires IP_HASH_SALT and BETTER_AUTH_SECRET in .env or the shell, and AUTH_SIMULATED off)
```

- **Web data source**: fixtures by default (`?fixture=sample|empty|loading|error`, stored in the `was_fixture` cookie);
  `VITE_DATA_SOURCE=http` uses the API (also at build time: `VITE_DATA_SOURCE=http pnpm build`). Simulated session in
  both modes: `?as=anon|reader|admin` (cookie `was_session`; sent to the API as the `x-was-session` header).
- **SSR**: the server renders every page with its data already in the HTML; the theme comes from the `was-theme`
  cookie. Variables: `APP_TIME_ZONE` (default `America/Sao_Paulo`), `PUBLIC_URL` (canonical/og links), `WEB_DIST_DIR`
  (default `apps/web/dist`). Without a web build, `pnpm start` serves the API only. SEO: `/robots.txt`, `/sitemap.xml`
  and JSON-LD on pages; anonymous HTML is publicly cacheable with an ETag (private when app cookies are present).
- **Sign-in**: Google only (Better Auth). Copy `.env.example` to `.env` and fill in `BETTER_AUTH_SECRET`,
  `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth client of type "Web application": origin `http://localhost:8787`,
  redirect `http://localhost:8787/api/auth/callback/google`) and `ADMIN_EMAILS`. Without credentials the app still
  starts and the sign-in dialog says Google sign-in is not configured; in development the simulated profiles keep
  working (`AUTH_SIMULATED`, forbidden in production).
- **Database**: `DATABASE_URL=postgres://…` replaces PGlite with Postgres. `pnpm db:migrate`, `pnpm db:generate`,
  `pnpm db:reset` (deletes and recreates the local PGlite). PGlite is single-process: stop `pnpm dev` before
  `pnpm db:seed`, `pnpm db:reset` or `pnpm ingest …`.
- **Ingestion**: `pnpm ingest <command>` (commands listed at the top of `packages/ingest/src/cli/ingest.cli.ts`),
  `pnpm ingest:report`, `pnpm ingest:worker`. Rankings: `pnpm rankings:calculate`.

## Run with Docker (local)

`docker-compose.yml` runs the whole app (SSR pages, API and Vite HMR) in one container on http://localhost:8787, with
its own database (`.data/pglite-docker`), the seed and published rankings. Edits on the host reload the page.

| Command | What it does |
|---|---|
| `pnpm docker:up` | Start the app in the background (first run installs, seeds and publishes rankings) |
| `pnpm docker:logs` | Follow the logs (wait for the seed on the first run) |
| `pnpm docker:down` | Stop and remove the containers (named volumes stay) |
| `pnpm docker:reset` | Recreate `.data/pglite-docker` from scratch — use it after a new migration |
| `pnpm docker:pg` | Start the optional Postgres 17 on port 5433 for the concurrency tests: `DATABASE_URL=postgres://postgres:pw@localhost:5433/postgres pnpm --filter @was/db test` |

### Bulk biography collection (worker)

The `ingest-worker` service (profile `worker`) runs `pnpm ingest collect` in the background against the compose Postgres
(port 5433), never against the app's PGlite. Ollama stays native on the Mac (Docker on macOS has no GPU/Metal); the worker
calls it at `host.docker.internal:11434`.

| Command | What it does |
|---|---|
| `pnpm docker:worker` | Start Postgres + the worker with the default job `--update --priority` (public, top-tier athletes first) |
| `COLLECT_ARGS="--list data/review/sample-200.csv" pnpm docker:worker` | Run another job, e.g. a list made by `pnpm collect:sample --n 200 --seed 42` |
| `pnpm docker:worker:logs` | Follow `data/review/collect.log` (one line per athlete: accepted / queued / rejected) |
| `DATABASE_URL=postgres://postgres:pw@localhost:5433/postgres pnpm ingest ai-report` | Calls, tokens, acceptance per model |

The job is resumable: after a reboot or restart it skips athletes that already have a biography of the current article
revision, and a finished job stays idle until `COLLECT_ARGS` changes. Without Docker: `pnpm collect:bg` (keeps the Mac
awake with `caffeinate`, logs to `data/review/collect.log`).

To have the app back by itself after a reboot, enable Docker Desktop → Settings → General → "Start Docker Desktop
when you sign in" (the container uses `restart: unless-stopped`).

Do not run `pnpm ingest …` or `pnpm db:*` on the host against `.data/pglite-docker` while the container is running:
PGlite accepts a single process. Stop the container first, or keep using your own `.data/pglite` on the host.

## Quality checks

| Check | Command |
|---|---|
| Types / tests / build | `pnpm typecheck`, `pnpm test`, `pnpm build` |
| Format and lint (Biome) | `pnpm lint` (`pnpm format` writes) |
| One declaration kind per file | `node scripts/scan/declaration-rules.mjs` |
| Duplication / dead code | `pnpm dup` / `pnpm deadcode` |
| Language (English outside i18n catalogs) | `pnpm scan:language` |
| Accessibility lint | `pnpm lint:a11y` |
| Bundle budget / Lighthouse | `pnpm perf:budget` / `pnpm perf:lighthouse` |
| End-to-end / load | `pnpm e2e` / `pnpm load` |

## CI and Docker

- **CI** (`.github/workflows/ci.yml`, on pull requests and pushes to `development`/`main`): the `verify` job runs
  `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint:a11y`, `pnpm test` (without `plan/`, the prototype
  tests are skipped), the build, `pnpm perf:budget`, the production smoke test and `pnpm audit --prod --audit-level=high`;
  the `lighthouse` job runs Lighthouse CI; the `docker` job builds the image (no push) and runs the same smoke test
  against the container. Actions are pinned by SHA.
- **Local smoke test** (same as CI; starts on port 8799 with in-memory PGlite and dummy secrets):
  `VITE_DATA_SOURCE=http pnpm build && bash scripts/ci/smoke.sh`. Against a running server:
  `BASE_URL=http://localhost:8787 bash scripts/ci/smoke.sh`.
- **Docker** (not deployed yet; the target hosting is described in
  [`docs/engineering/architecture.md`](docs/engineering/architecture.md)): `node:26-slim` image pinned by digest, user
  `node`, port 8787, PGlite on the `/data` volume, HEALTHCHECK on `/api/health`.
  ```bash
  docker build -t world-all-stars .
  # .env.production (outside git): IP_HASH_SALT, BETTER_AUTH_SECRET, PUBLIC_URL, BETTER_AUTH_URL, CORS_ORIGINS,
  # GOOGLE_CLIENT_ID/SECRET, ADMIN_EMAILS and AUTH_SIMULATED=0 (see .env.example)
  docker run -d --name was -p 8787:8787 --env-file .env.production -v was-data:/data world-all-stars
  ```
  The database starts empty (migrations run on boot). With Postgres, pass `DATABASE_URL` and the volume is no longer
  needed.
