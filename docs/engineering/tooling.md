# Tooling

Quality tools installed in Phase 0 (T0.2). Versions are pinned exactly and were published at least 14 days before
installation (2026-11-23). None of these gates block CI yet; T0.10 turns them on.

## Installed

| Tool | Version | Where | Script | Why |
|---|---|---|---|---|
| `@biomejs/biome` | 2.6.6 | root devDep | `pnpm lint`, `pnpm format` | Formatter and linter (recommended preset). Config: `biome.json` |
| `jscpd` | 5.4.3 | root devDep | `pnpm dup` | Copy/paste detection, threshold 1 %. Config: `.jscpd.json` |
| `knip` | 6.44.2 | root devDep | `pnpm deadcode` | Unused files, exports and dependencies. Config: `knip.json` |
| `@playwright/test` | 1.65.0 | `apps/web` devDep | `pnpm e2e` | End-to-end tests (`apps/web/e2e`, `apps/web/playwright.config.ts`) |
| `@axe-core/playwright` | 4.14.0 | `apps/web` devDep | `pnpm e2e` | WCAG 2.2 AA checks inside E2E |
| `@sentry/node` | 11.11.0 | `apps/server` dep | — | Server error tracking (wired in T7.5) |
| `@sentry/react` | 11.11.0 | `apps/web` dep | — | Browser error tracking (wired in T7.5) |
| `read-excel-file` | 9.3.14 | `packages/ingest` dep | — | Reads the Olympic medalists spreadsheet (T5.4) |
| k6 | owner binary / CI action `grafana/setup-k6-action` | — | `pnpm load` | Load test (`scripts/load/smoke.js`) |
| `@lhci/cli` | 0.16.0 via `npx` | — | `pnpm perf:lighthouse` | Lighthouse CI (unchanged) |

Also added: `pnpm scan:mixed` and `pnpm scan:language` (the T0.1 scan scripts in `scripts/scan/`).

Playwright browsers are not installed automatically. Locally: `pnpm --filter web exec playwright install chromium`;
in CI: `pnpm --filter web exec playwright install --with-deps chromium`.

## Not installed

| Tool | Reason |
|---|---|
| `otpauth`, `qrcode` | Better Auth 1.7.17 ships the `twoFactor` plugin (`better-auth/plugins/two-factor`); T6.1 uses it instead. |
| `eslint`, `typescript-eslint`, `eslint-plugin-check-file`, `eslint-plugin-i18next` | **Deferred (blocker).** `typescript-eslint` needs the TypeScript JavaScript API (`typescript <6.1`); the repo uses TypeScript 7.0.2, which has none. |
| `dependency-cruiser` | **Deferred (blocker).** Same cause: it needs `typescript <7` to parse TS sources (with TS 7 it cruises only 6 modules). |

Until those are resolved, the one-kind-per-file and layering rules (T0.3) have no automated check besides
`pnpm scan:mixed`.

## Formatter settings

2-space indent, single quotes (double in JSX), trailing commas, semicolons, line width **160**. Measured line widths
of non-empty TS/TSX lines: p95 = 135, p98 = 171. 160 (the handoff default) was kept over the p95 to avoid reformatting
long lines that are already common in the codebase. Ignored: `plan/`, `data/`, migrations, `scripts/crawler/`, `dist/`,
JSON files and `pnpm-lock.yaml`.

## Initial counts (2026-11-23, before any refactor)

| Check | Result |
|---|---|
| `pnpm lint` (Biome) | 600 errors, 302 warnings, 1 info — mostly `organizeImports` (203), `noNonNullAssertion` (251), `noArrayIndexKey` (23); formatter would change 310 files |
| `pnpm dup` (jscpd) | 24 clones, ≈ 0.47 % duplicated lines (under the 1 % threshold) |
| `pnpm deadcode` (knip) | 1 unused file, 3 unused deps (the new Sentry/Excel deps, used in later phases), 2 unused devDeps, 27 unused exports, 19 unused exported types |
| `pnpm e2e` | 1 smoke test listed (`playwright test --list`); browsers not downloaded yet |
| `pnpm load` | k6 not installed on this machine |

## Known issue

Biome's `organizeImports` assist sorts the package barrels (`packages/*/src/index.ts`) as one block and moves their
section comments (`// Consts`, `// Helpers`, …) to the wrong lines. Do not run `biome check --write` on the barrels
until this is settled (T0.10: either drop the section comments or disable the assist for `**/src/index.ts`).
