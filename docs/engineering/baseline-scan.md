# Baseline scan (Phase 0, T0.1)

Snapshot of the repository before the Phase 0 refactors, so later phases can measure progress.
Regenerate the inventories with the scripts in `scripts/scan/`.

## Environment

| Item | Value |
|---|---|
| Date | 2026-11-23 |
| Commit | `b439811689e31b8afccb9e0ac966ca3f179ed6b7` (branch `development`) |
| Node | v26.10.0 |
| pnpm | 11.13.0 |
| TypeScript | 7.0.2 (native compiler; ships **no JavaScript compiler API**) |

## Build

| Step | Result |
|---|---|
| `pnpm typecheck` | pass |
| `pnpm build` | pass |
| `pnpm test` | pass after one fix (see below) |

Tests per package:

| Package | Test files | Tests |
|---|---|---|
| `@was/shared` | 18 | 107 |
| `@was/db` | 4 | 24 |
| `@was/ingest` | 9 | 37 |
| `@was/ranking` | 1 | 6 |
| `server` | 9 | 114 |
| `web` | 11 | 447 |
| **Total** | **52** | **735** |

Finding: `apps/web/src/app/a11y.test.ts` (`/ has no axe violations`) timed out at vitest's 5 s default whenever all
suites ran in parallel (cold SSR render); it passed in isolation. Fixed in this task with a 20 s `describe` timeout.

## File kinds

Files by suffix (`<name>.<suffix>.ts[x]`; `(none)` = no role suffix, e.g. `client.ts`, `engine.ts`).

| Directory | Counts |
|---|---|
| `apps/server/src` | route 14, service 11, (none) 10, test 9, middleware 6, helper 6, repository 5, provider 3, type 2, config 2, store 1, scheduler 1, mapper 1, error 1, cli 1, cache 1 |
| `packages/db/src` | table 24, seed 7, (none) 5, test 4, cli 4, helper 3, column 2, repository 1 |
| `packages/ingest/src` | (none) 12, test 9, provider 6, cli 1 |
| `packages/ranking/src` | (none) 3, methodology 2, test 1 |
| `packages/shared/src` | enum 66, schema 45, helper 33, const 22, test 18, type 4, contract 4, es 3, en 3, fixture 1, d 1, (none) 1 |
| `apps/web/src` | component 148, helper 42, page 30, const 24, hook 22, es 20, en 20, test 11, query 11, fixture 10, (none) 9, type 6, store 5, d 2, registry 1, error 1 |

## Mixed files

Top-level declaration kinds per file (`type` = interface or type alias, `const` = SCREAMING_SNAKE const,
`function`, `class`), tests excluded. Script: `node scripts/scan/mixed-declarations.mjs [--min N]`.
Parsing uses the oxc parser bundled with Vite (`rolldown/parseAst`) because TypeScript 7 has no JS compiler API.

Note: `function, type` in `*.component.tsx` / `*.page.tsx` is usually the allowed local `Props` exception (§5.1).

| Kinds combination | Files |
|---|---|
| function, type | 131 |
| const, type | 75 |
| const, function, type | 50 |
| const, function | 37 |
| class, const, function, type | 9 |
| class, function | 2 |

Total files with ≥ 2 kinds: 304.

### Files with ≥ 3 kinds

| Path | Kinds | Count |
|---|---|---|
| `apps/server/src/modules/catalog/catalog.mapper.ts` | class, const, function, type | 4 |
| `apps/server/src/web/html-cache.ts` | class, const, function, type | 4 |
| `apps/server/src/web/image-proxy.route.ts` | class, const, function, type | 4 |
| `apps/server/src/web/web-handler.ts` | class, const, function, type | 4 |
| `packages/db/src/repositories/base.repository.ts` | class, const, function, type | 4 |
| `packages/ingest/src/canonical/canonical-writer.ts` | class, const, function, type | 4 |
| `packages/ingest/src/enrich/ai.ts` | class, const, function, type | 4 |
| `packages/ingest/src/http/safe-fetch.ts` | class, const, function, type | 4 |
| `packages/ingest/src/identity/resolver.ts` | class, const, function, type | 4 |
| `apps/server/src/config/env.config.ts` | const, function, type | 3 |
| `apps/server/src/middlewares/compress.middleware.ts` | const, function, type | 3 |
| `apps/server/src/modules/catalog/catalog.repository.ts` | const, function, type | 3 |
| `apps/server/src/modules/rankings/rankings.service.ts` | const, function, type | 3 |
| `apps/server/src/test/test-app.helper.ts` | const, function, type | 3 |
| `apps/server/src/web/slug-redirect.ts` | const, function, type | 3 |
| `apps/server/src/web/vite-dev.ts` | const, function, type | 3 |
| `apps/server/src/web/web-assets.helper.ts` | const, function, type | 3 |
| `apps/web/src/app/request-scope.ts` | const, function, type | 3 |
| `apps/web/src/app/router.tsx` | const, function, type | 3 |
| `apps/web/src/data/demo.store.ts` | const, function, type | 3 |
| `apps/web/src/data/http-client.helper.ts` | const, function, type | 3 |
| `apps/web/src/modules/account/account-layout.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/account/me.page.tsx` | const, function, type | 3 |
| `apps/web/src/modules/athletes/analysis-tab.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/athletes/sport-panels/football-panel.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/athletes/sport-panels/generic-panel.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/athletes/sport-panels/sport-panel.registry.tsx` | const, function, type | 3 |
| `apps/web/src/modules/home/desk-globe.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/home/home-stage.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/home/month-calendar.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/sources/source-item.component.tsx` | const, function, type | 3 |
| `apps/web/src/modules/sports/org-hierarchy.component.tsx` | const, function, type | 3 |
| `apps/web/src/shared-ui/notice.component.tsx` | const, function, type | 3 |
| `apps/web/src/shared-ui/status-filter.component.tsx` | const, function, type | 3 |
| `apps/web/src/shared-ui/theme.const.ts` | const, function, type | 3 |
| `packages/db/src/client.ts` | const, function, type | 3 |
| `packages/db/src/seeds/domain.seed.ts` | const, function, type | 3 |
| `packages/db/src/seeds/prototype.seed.ts` | const, function, type | 3 |
| `packages/db/src/seeds/sources-policy.seed.ts` | const, function, type | 3 |
| `packages/db/src/seeds/sports-catalog.seed.ts` | const, function, type | 3 |
| `packages/db/src/seeds/universal-backfill.seed.ts` | const, function, type | 3 |
| `packages/ingest/src/canonical/apply-ai.ts` | const, function, type | 3 |
| `packages/ingest/src/parsers/wikitext.ts` | const, function, type | 3 |
| `packages/ingest/src/providers/athlete-list.provider.ts` | const, function, type | 3 |
| `packages/ingest/src/providers/football-champions.provider.ts` | const, function, type | 3 |
| `packages/ingest/src/providers/olympic-medalists.provider.ts` | const, function, type | 3 |
| `packages/ingest/src/providers/wikidata-profile.provider.ts` | const, function, type | 3 |
| `packages/ingest/src/providers/wikidata.provider.ts` | const, function, type | 3 |
| `packages/ranking/src/core/engine.ts` | const, function, type | 3 |
| `packages/ranking/src/methodologies/bjj-career/bjj-career.methodology.ts` | const, function, type | 3 |
| `packages/ranking/src/methodologies/football-champions/football-champions.methodology.ts` | const, function, type | 3 |
| `packages/shared/src/helpers/achievement.helper.ts` | const, function, type | 3 |
| `packages/shared/src/helpers/admin-rules.helper.ts` | const, function, type | 3 |
| `packages/shared/src/helpers/commons-image.helper.ts` | const, function, type | 3 |
| `packages/shared/src/helpers/source-url.helper.ts` | const, function, type | 3 |
| `packages/shared/src/i18n/formatters.helper.ts` | const, function, type | 3 |
| `packages/shared/src/i18n/locale.const.ts` | const, function, type | 3 |
| `packages/shared/src/seo/json-ld.helper.ts` | const, function, type | 3 |
| `packages/shared/src/seo/sitemap.helper.ts` | const, function, type | 3 |

## Duplicates

One-off run: `npx -y jscpd@5.4.3 --min-tokens 40 apps packages` ignoring tests, migrations, fixtures, JSON and CSS.

> Duplications detection: Found 25 exact clones with 185(0.47%) duplicated lines in 645 (5 formats) files.

| Format | Files analyzed | Total lines | Total tokens | Clones found | Duplicated lines | Duplicated tokens |
|--------|---------------|-------------|--------------|--------------|------------------|-------------------|
| javascript | 2 | 67 | 585 | 0 | 0 (0.00%) | 0 (0.00%) |
| markdown | 4 | 331 | 13793 | 0 | 0 (0.00%) | 0 (0.00%) |
| text | 2 | 32 | 2563 | 0 | 0 (0.00%) | 0 (0.00%) |
| tsx | 184 | 12723 | 107195 | 12 | 97 (0.76%) | 604 (0.56%) |
| typescript | 453 | 26435 | 230502 | 13 | 88 (0.33%) | 734 (0.32%) |
| Total: | 645 | 39588 | 354638 | 25 | 185 (0.47%) | 1338 (0.38%) |

Clones (path [start - end] ↔ path [start - end]):

- server/src/cli/rankings.cli.ts [7:73 - 12:6] (6 lines, 41 tokens) ingest/src/cli/ingest.cli.ts [39:70 - 44:6]
- server/src/modules/admin/admin-community.service.ts [177:65 - 182:13] (6 lines, 48 tokens) server/src/modules/admin/admin-community.service.ts [187:67 - 193:13]
- server/src/modules/admin/admin-review.service.ts [76:216 - 84:6] (9 lines, 45 tokens) server/src/modules/admin/admin-review.service.ts [94:26 - 102:4]
- server/src/modules/catalog/catalog.repository.ts [69:5 - 74:4] (6 lines, 124 tokens) server/src/modules/catalog/catalog.repository.ts [143:5 - 148:4]
- web/src/data/fixture-mode.store.ts [29:70 - 37:13] (9 lines, 43 tokens) web/src/i18n/locale.store.ts [22:33 - 31:13]
- web/src/data/fixture-mode.store.ts [30:3 - 37:13] (8 lines, 41 tokens) web/src/session/session.store.ts [35:3 - 42:13]
- web/src/modules/admin/admin-comments.page.tsx [6:10 - 13:9] (8 lines, 49 tokens) web/src/modules/admin/admin-privacy.page.tsx [5:31 - 13:9]
- web/src/modules/admin/admin-comments.page.tsx [6:65 - 13:9] (8 lines, 45 tokens) web/src/modules/admin/proposal-queue.component.tsx [6:59 - 13:9]
- web/src/modules/admin/admin-comments.page.tsx [13:50 - 20:9] (8 lines, 45 tokens) web/src/modules/admin/admin-users.page.tsx [16:72 - 23:9]
- web/src/modules/admin/admin-ingestion.page.tsx [148:35 - 155:13] (8 lines, 55 tokens) web/src/modules/admin/admin-privacy.page.tsx [101:45 - 108:21]
- web/src/modules/admin/dossier-queue.component.tsx [9:61 - 16:9] (8 lines, 45 tokens) web/src/modules/admin/proposal-queue.component.tsx [7:59 - 15:9]
- web/src/modules/admin/dossier-queue.component.tsx [16:57 - 26:19] (11 lines, 61 tokens) web/src/modules/admin/proposal-queue.component.tsx [13:48 - 23:19]
- web/src/modules/athletes/achievements-tab.component.tsx [48:100 - 54:22] (7 lines, 43 tokens) web/src/modules/athletes/achievements-tab.component.tsx [89:40 - 95:22]
- web/src/modules/athletes/achievements-tab.component.tsx [57:126 - 66:2] (10 lines, 71 tokens) web/src/modules/athletes/achievements-tab.component.tsx [98:54 - 107:2]
- web/src/modules/athletes/athletes.page.tsx [102:49 - 107:32] (6 lines, 44 tokens) web/src/modules/athletes/athletes.page.tsx [109:41 - 114:32]
- web/src/modules/athletes/athletes.page.tsx [127:13 - 133:51] (7 lines, 44 tokens) web/src/modules/sports/sport-filters.component.tsx [56:9 - 64:24]
- web/src/modules/contact/message-form.component.tsx [8:73 - 17:9] (10 lines, 52 tokens) web/src/modules/contact/suggestion-form.component.tsx [17:65 - 26:9]
- web/src/modules/contact/message-form.component.tsx [63:70 - 68:2] (6 lines, 50 tokens) web/src/modules/contact/suggestion-form.component.tsx [123:93 - 128:2]
- db/src/tables/competition.table.ts [66:11 - 71:63] (6 lines, 49 tokens) db/src/tables/taxonomy.table.ts [132:25 - 137:63]
- db/src/tables/participation.table.ts [81:57 - 87:7] (7 lines, 48 tokens) db/src/tables/participation.table.ts [94:54 - 98:60]
- db/src/tables/recognition.table.ts [73:19 - 78:17] (6 lines, 47 tokens) db/src/tables/recognition.table.ts [99:17 - 104:17]
- db/src/tables/structure.table.ts [31:23 - 36:12] (6 lines, 43 tokens) db/src/tables/structure.table.ts [64:20 - 69:12]
- ingest/src/cli/ingest.cli.ts [126:21 - 131:12] (6 lines, 119 tokens) ingest/src/collect.ts [39:10 - 44:2]
- ingest/src/enrich/ai.ts [126:31 - 131:41] (6 lines, 40 tokens) ingest/src/enrich/ai.ts [196:38 - 201:41]
- shared/src/helpers/suggestion-validation.helper.ts [6:1 - 12:14] (7 lines, 46 tokens) shared/src/helpers/text-validation.helper.ts [1:29 - 7:14]

jscpd sees only token-identical clones; the semantic duplicates of §16.A (Retry-After loops, `sleep` ×4, two
`WdEntity`, Wikimedia URL building, batches of 50, two provider registries, `as unknown as { rows }` ≈25, text
normalization variants, `pad2`/`groupBy`/`byId`/`isoOf`, Cache-Control literals, scheduler and CLI bootstraps) remain
the work list for T0.4/T0.7.

## Non-English

Script: `node scripts/scan/non-english.mjs [--details] [--fail]`. Scans `apps/`, `packages/`, `scripts/`, `.github/`,
`README.md` and `data/seeds/README.md` for Portuguese accents and marker words, excluding `scripts/crawler/**` and the
crawler CSV/MD (D36), `packages/shared/src/i18n/**`, `packages/shared/src/consts/*-messages.const.ts`, pt-BR web
catalogs (`apps/web/src/**/*.const.ts` with `.en.ts`/`.es.ts` siblings), `*.{en,es,pt}.ts` and
`packages/db/src/seeds/content-translations.json`.

Hits include legitimate localized data (for example `pt:` label fields in seeds and in the historical-country map of
`canonical-writer.ts`); T0.9 moves those into allowlisted catalogs or consts and makes the scan CI-blocking.

Non-English hits: 589 lines in 163 files

| Path | Lines |
|---|---|
| `apps/web/FRONTEND.md` | 79 |
| `apps/server/BACKEND.md` | 68 |
| `packages/db/src/seeds/domain.seed.ts` | 48 |
| `data/seeds/README.md` | 28 |
| `README.md` | 21 |
| `apps/web/src/shared-ui/shared-ui.css` | 16 |
| `packages/shared/src/theme/theme.css` | 16 |
| `apps/web/src/modules/home/home.page.css` | 12 |
| `apps/server/src/test/mutations.test.ts` | 11 |
| `apps/web/src/i18n/messages-coverage.test.ts` | 11 |
| `apps/web/src/modules/athletes/tier-page.css` | 11 |
| `scripts/catalog/sports.seed.mjs` | 11 |
| `apps/web/src/app/styles.css` | 10 |
| `packages/ingest/src/enrich/ai.test.ts` | 10 |
| `packages/shared/src/helpers/suggestion-validation.helper.test.ts` | 10 |
| `apps/web/src/app/entry-server.test.ts` | 7 |
| `packages/shared/src/enums/athlete-profile-tab.enum.ts` | 6 |
| `scripts/fixtures/admin-fixture-mappers.mjs` | 6 |
| `apps/web/src/modules/contact/contact.page.tsx` | 5 |
| `packages/shared/src/helpers/zod-error-map.helper.test.ts` | 5 |
| `packages/shared/src/schemas/page-search.schema.ts` | 5 |
| `packages/shared/src/seo/seo.helper.test.ts` | 5 |
| `scripts/fixtures/prototype-demo-activity.mjs` | 5 |
| `apps/web/src/modules/account/notifications.page.tsx` | 4 |
| `packages/ingest/src/canonical/canonical-writer.ts` | 4 |
| `packages/ingest/src/providers/bjj-champions.provider.ts` | 4 |
| `scripts/fixtures/english-base-text.json` | 4 |
| `scripts/fixtures/english-slugs.mjs` | 4 |
| `apps/server/src/test/web.test.ts` | 3 |
| `packages/ingest/src/identity/identity-sample.ts` | 3 |
| `packages/shared/src/enums/contact-tab.enum.ts` | 3 |
| `packages/shared/src/enums/notification-filter.enum.ts` | 3 |
| `packages/shared/src/helpers/account.helper.test.ts` | 3 |
| `apps/server/src/test/auth.test.ts` | 2 |
| `apps/server/src/test/i18n.test.ts` | 2 |
| `apps/web/src/app/a11y.test.ts` | 2 |
| `apps/web/src/modules/athletes/athlete-profile.css` | 2 |
| `apps/web/src/modules/contact/suggestion-form.component.tsx` | 2 |
| `apps/web/src/modules/hall-of-greats/hall-of-greats.page.css` | 2 |
| `apps/web/src/modules/legal/legal-links.component.tsx` | 2 |
| `apps/web/src/shared-ui/page-header-media.css` | 2 |
| `packages/ingest/src/parity.test.ts` | 2 |
| `packages/ingest/src/providers/football-champions.provider.ts` | 2 |
| `packages/ingest/src/providers/providers.test.ts` | 2 |
| `packages/shared/src/consts/org-labels.const.ts` | 2 |
| `packages/shared/src/helpers/api-contract.helper.test.ts` | 2 |
| `packages/shared/src/helpers/athlete-filter.helper.test.ts` | 2 |
| `packages/shared/src/helpers/sports-directory.helper.test.ts` | 2 |
| `packages/shared/src/helpers/text-normalize.helper.test.ts` | 2 |
| `packages/shared/src/helpers/text-normalize.helper.ts` | 2 |
| `packages/shared/src/helpers/text-validation.helper.test.ts` | 2 |
| `apps/server/src/auth/better-auth.config.ts` | 1 |
| `apps/server/src/modules/admin/admin-collection.service.ts` | 1 |
| `apps/server/src/modules/catalog/catalog.mapper.ts` | 1 |
| `apps/server/src/modules/sports/sports.route.ts` | 1 |
| `apps/server/src/test/contracts.test.ts` | 1 |
| `apps/web/src/app/request-scope.ts` | 1 |
| `apps/web/src/data/endpoints/admin.query.ts` | 1 |
| `apps/web/src/data/fixtures/admin.fixture.ts` | 1 |
| `apps/web/src/fixtures/sample/admin-comments.json` | 1 |
| `apps/web/src/fixtures/sample/admin-dossiers.json` | 1 |
| `apps/web/src/fixtures/sample/admin-inbox.json` | 1 |
| `apps/web/src/fixtures/sample/admin-ingestion.json` | 1 |
| `apps/web/src/fixtures/sample/admin-privacy.json` | 1 |
| `apps/web/src/fixtures/sample/admin-users.json` | 1 |
| `apps/web/src/fixtures/sample/athlete-names.json` | 1 |
| `apps/web/src/fixtures/sample/athlete-profiles.json` | 1 |
| `apps/web/src/fixtures/sample/athletes.json` | 1 |
| `apps/web/src/fixtures/sample/calendar.json` | 1 |
| `apps/web/src/fixtures/sample/comments.json` | 1 |
| `apps/web/src/fixtures/sample/globe.json` | 1 |
| `apps/web/src/fixtures/sample/governance-models.json` | 1 |
| `apps/web/src/fixtures/sample/hall-of-greats.json` | 1 |
| `apps/web/src/fixtures/sample/on-this-day.json` | 1 |
| `apps/web/src/fixtures/sample/organizations.json` | 1 |
| `apps/web/src/fixtures/sample/session-users.json` | 1 |
| `apps/web/src/fixtures/sample/sources.json` | 1 |
| `apps/web/src/fixtures/sample/sport-pages.json` | 1 |
| `apps/web/src/fixtures/sample/sports.json` | 1 |
| `apps/web/src/fixtures/sample/validation-context.json` | 1 |
| `apps/web/src/modules/about/criteria.page.tsx` | 1 |
| `apps/web/src/modules/admin/admin-comments.page.tsx` | 1 |
| `apps/web/src/modules/admin/admin-contact.page.tsx` | 1 |
| `apps/web/src/modules/admin/admin-dossiers.page.tsx` | 1 |
| `apps/web/src/modules/admin/admin-ingestion.page.tsx` | 1 |
| `apps/web/src/modules/admin/admin-review.page.tsx` | 1 |
| `apps/web/src/modules/admin/admin-sources.page.tsx` | 1 |
| `apps/web/src/modules/admin/admin-users.page.tsx` | 1 |
| `apps/web/src/modules/admin/dossier-queue.component.tsx` | 1 |
| `apps/web/src/modules/admin/source-link.component.tsx` | 1 |
| `apps/web/src/modules/athletes/achievements-tab.component.tsx` | 1 |
| `apps/web/src/modules/athletes/analysis-tab.component.tsx` | 1 |
| `apps/web/src/modules/athletes/athlete-hero.component.tsx` | 1 |
| `apps/web/src/modules/athletes/athlete-profile.helper.ts` | 1 |
| `apps/web/src/modules/athletes/career-tab.component.tsx` | 1 |
| `apps/web/src/modules/athletes/comments-tab.component.tsx` | 1 |
| `apps/web/src/modules/athletes/compare-picker.component.tsx` | 1 |
| `apps/web/src/modules/athletes/legacy-card.component.tsx` | 1 |
| `apps/web/src/modules/athletes/overview-tab.component.tsx` | 1 |
| `apps/web/src/modules/athletes/sources-tab.component.tsx` | 1 |
| `apps/web/src/modules/contact/message-form.component.tsx` | 1 |
| `apps/web/src/modules/errors/error.page.tsx` | 1 |
| `apps/web/src/modules/errors/errors.page.css` | 1 |
| `apps/web/src/modules/errors/not-found.page.tsx` | 1 |
| `apps/web/src/modules/home/desk-globe.component.tsx` | 1 |
| `apps/web/src/modules/home/globe-section.component.tsx` | 1 |
| `apps/web/src/modules/home/hall-of-greats-band.component.tsx` | 1 |
| `apps/web/src/modules/home/home-stage.component.tsx` | 1 |
| `apps/web/src/modules/home/month-calendar.component.tsx` | 1 |
| `apps/web/src/modules/sports/sport-associations.component.tsx` | 1 |
| `apps/web/src/modules/sports/sport-filters.component.tsx` | 1 |
| `apps/web/src/modules/sports/sport-governance.component.tsx` | 1 |
| `apps/web/src/modules/sports/sport.page.tsx` | 1 |
| `apps/web/src/session/consent-dialog.component.tsx` | 1 |
| `apps/web/src/shared-ui/avatar.component.tsx` | 1 |
| `apps/web/src/shared-ui/breadcrumb.component.tsx` | 1 |
| `apps/web/src/shared-ui/date-link.component.tsx` | 1 |
| `apps/web/src/shared-ui/decision-bar.component.tsx` | 1 |
| `apps/web/src/shared-ui/empty-state.component.tsx` | 1 |
| `apps/web/src/shared-ui/event-list.component.tsx` | 1 |
| `apps/web/src/shared-ui/filter-bar.component.tsx` | 1 |
| `apps/web/src/shared-ui/main-nav.component.tsx` | 1 |
| `apps/web/src/shared-ui/motion-preference.ts` | 1 |
| `apps/web/src/shared-ui/motion-toggle.component.tsx` | 1 |
| `apps/web/src/shared-ui/motion.helper.ts` | 1 |
| `apps/web/src/shared-ui/page-header.component.tsx` | 1 |
| `apps/web/src/shared-ui/query-boundary.component.tsx` | 1 |
| `apps/web/src/shared-ui/range-bars.css` | 1 |
| `apps/web/src/shared-ui/relative-time.helper.ts` | 1 |
| `apps/web/src/shared-ui/source-info.component.tsx` | 1 |
| `apps/web/src/shared-ui/sport-card.component.tsx` | 1 |
| `apps/web/src/shared-ui/stub-page.component.tsx` | 1 |
| `apps/web/src/shared-ui/tabs.component.tsx` | 1 |
| `apps/web/src/shared-ui/tier-portrait.css` | 1 |
| `apps/web/src/shared-ui/tier-tag.component.tsx` | 1 |
| `apps/web/src/shared-ui/timeline.component.tsx` | 1 |
| `apps/web/src/shared-ui/use-url-search-text.hook.ts` | 1 |
| `packages/db/src/repositories/base.repository.ts` | 1 |
| `packages/db/src/seeds/config.seed.ts` | 1 |
| `packages/db/src/seeds/sources-policy.seed.ts` | 1 |
| `packages/db/src/seeds/universal-backfill.seed.ts` | 1 |
| `packages/db/src/seeds/universal-backfill.test.ts` | 1 |
| `packages/db/src/tables/competition.table.ts` | 1 |
| `packages/db/src/tables/config.table.ts` | 1 |
| `packages/db/src/tables/geography.table.ts` | 1 |
| `packages/db/src/tables/ingestion.table.ts` | 1 |
| `packages/ingest/src/cli/ingest.cli.ts` | 1 |
| `packages/ingest/src/parsers/wikitext.test.ts` | 1 |
| `packages/ranking/src/methodologies/football-champions/METHODOLOGY.md` | 1 |
| `packages/shared/src/consts/home.const.ts` | 1 |
| `packages/shared/src/consts/sports-directory.const.ts` | 1 |
| `packages/shared/src/consts/tier-medal.const.ts` | 1 |
| `packages/shared/src/enums/on-this-day-kind.enum.ts` | 1 |
| `packages/shared/src/helpers/account.helper.ts` | 1 |
| `packages/shared/src/helpers/contact-validation.helper.ts` | 1 |
| `packages/shared/src/helpers/home.helper.ts` | 1 |
| `packages/shared/src/helpers/source-url.helper.test.ts` | 1 |
| `packages/shared/src/helpers/source-url.helper.ts` | 1 |
| `packages/shared/src/helpers/suggestion-validation.helper.ts` | 1 |
| `packages/shared/src/schemas/admin-curation.schema.ts` | 1 |
| `packages/shared/src/schemas/on-this-day.schema.ts` | 1 |
| `packages/shared/src/seo/json-ld.helper.ts` | 1 |
| `scripts/fixtures/export-prototype-fixtures.mjs` | 1 |

Additional finding not in §16.A: athlete profile tab values `analise` and `comentarios`
(`packages/shared/src/enums/athlete-profile-tab.enum.ts`, used by `?tab=` in web tests) are also Portuguese URL values.

## Known findings (survey 2026-11-23, handoff §16.A)

**Files mixing 4 kinds:** `packages/db/src/repositories/base.repository.ts`, `packages/ingest/src/enrich/ai.ts`,
`packages/ingest/src/identity/resolver.ts`, `packages/ingest/src/http/safe-fetch.ts`,
`apps/server/src/modules/catalog/catalog.mapper.ts` (798 lines), `apps/server/src/web/image-proxy.route.ts`,
`packages/ingest/src/canonical/canonical-writer.ts`, `apps/server/src/web/html-cache.ts`,
`apps/server/src/web/web-handler.ts`.

**Files mixing 3 kinds (≈30):** see the "Files with ≥ 3 kinds" table above (it supersedes the survey list).

**Duplicates:** Retry-After loops (`wikidata.provider.ts:44-53`, `wikidata-profile.provider.ts:57-68`); `sleep` ×4
(`wikidata-profile.provider.ts:51`, `wikidata.provider.ts:51`, `safe-fetch.ts:72`,
`apps/web/src/data/run-fixture.helper.ts:22`); `WdEntity` ×2; Wikidata/Wikipedia URL building ≈10 places
(`providers/context.ts`, `collect.ts`, `athlete-list.provider.ts`, `cli/ingest.cli.ts`, `canonical-writer.ts`);
batches of 50 ×5; biography input building (`collect.ts:27-44` ≡ `cli/ingest.cli.ts:111-131`); provider registries ×2
(`ingest.cli.ts:50-54`, `ingestion-runner.ts:19-22`); `as unknown as { rows }` ≈25; text normalization variants
(`norm` football-champions, `normalize` sports-catalog.seed, `squash` ai.ts, `slugify` canonical-writer,
`normalizeName` resolver) vs SoT `packages/shared/src/helpers/text-normalize.helper.ts`; `pad2`, `groupBy`, `byId`,
`isoOf`; Cache-Control literals (html-cache, web-handler, image-proxy, seo.route); scheduler skeleton
(cleanup.scheduler, ingestion-runner); CLI bootstrap ×5.

**Non-English code values:** URL query keys `filtro`, `tipo` (`packages/shared/src/schemas/page-search.schema.ts:19,27`);
enum values `visao-geral|conquistas|carreira|fontes` (`athlete-profile-tab.enum.ts`), `sugestao|mensagem`
(`contact-tab.enum.ts`), `nao-lidas|lidas` (`notification-filter.enum.ts`); slug `organizador-nao-informado`
(`catalog.mapper.ts:50`); regex `não defendeu` (`universal-backfill.seed.ts:48`, data matching: keep the Portuguese
literal, move it to a const with an English comment). Portuguese comments (≈20) in server/shared/db/web; docs
`README.md`, `apps/server/BACKEND.md`, `apps/web/FRONTEND.md`, `data/seeds/README.md`.

**Excluded (D36):** `scripts/crawler/**`, `data/seeds/atletas.csv`, `data/seeds/fontes-crawler.csv`,
`data/seeds/relatorio-crawler.md`.
