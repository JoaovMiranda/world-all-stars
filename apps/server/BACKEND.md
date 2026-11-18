# apps/server + packages/db · guia do back-end (fase 1)

API Hono que serve **exatamente** os contratos de `@was/shared` (`packages/shared/src/contracts/*.contract.ts`), sobre Postgres via Drizzle (PGlite embutido por padrão). Regras de negócio, schemas, enums e mensagens vêm **só** do shared: o servidor aplica, nunca redefine.

## Arquitetura
```
packages/db/src/                     @was/db
  columns/base.column.ts             baseColumns() (uuid v7, created/updated/deleted_at/by, created_via, version) + live() p/ índices parciais
  columns/pg-enum.column.ts          pgEnum criados a partir dos *_VALUES do shared
  tables/*.table.ts                  tabelas por agregado (tabela + *_translations), ~75 tabelas (doc 03)
  repositories/base.repository.ts    ÚNICO escritor: insert/update/softDelete/restore/ensure/increment/audit
  migrations/                        geradas pelo drizzle-kit (+ 0001 forbid-delete: trigger que bloqueia DELETE físico)
  seeds/                             config.seed (níveis/tiers do shared) + prototype.seed (mock DB do protótipo)
  client.ts                          createDatabase(): node-postgres (DATABASE_URL) ou PGlite (.data/pglite | memory://)
apps/server/src/
  main.ts / app.ts                   bootstrap (migra no boot) / createApp() (testes usam app.request)
  http/contract-route.helper.ts      defineRoute(contract, handler) + registerRoutes(): o coração do DRY
  http/http-error.error.ts           HttpError + notFound/forbidden/unprocessable/invalidFields (corpo = ApiErrorSchema)
  auth/                              AuthProvider: better-auth.config/provider (Google) + simulated (dev) via composite.provider; auth-user.helper (loadAuthUser, consent rule); admin-bootstrap (ADMIN_EMAILS)
  middlewares/                       error, request-log, rate-limit (stub), session (AuthProvider + ip_hash + actor)
  modules/<feature>/                 *.route.ts (contrato → handler) · *.service.ts (regras) · *.repository.ts (Drizzle)
  modules/catalog/                   snapshot do catálogo em memória + CatalogView (linhas → views dos contratos)
  routes.ts                          ALL_ROUTES (um teste garante: todo contrato servido exatamente uma vez)
```
Fluxo de uma requisição: `requestLog → secureHeaders → locale → cors → [/api/auth/* = Better Auth] → session (AuthProvider) → rota gerada do contrato`.

**Idiomas (pt-BR, en, es; mesma URL, doc 12):** `middlewares/locale.middleware.ts` resolve o idioma de cada chamada `/api` com `resolveLocale` do shared: `?locale=` → header `x-was-locale` (o web manda o idioma atual) → cookie `was_locale` → `Accept-Language` → pt-BR. Fica em `ctx.locale` e sai em `Content-Language` (+ `Vary: Accept-Language, Cookie, x-was-locale`). Erros: `HttpError` leva `messageKey` (chave de `API_ERROR_MESSAGES`) e o `errorHandler` traduz; validadores e regras do shared recebem `ctx.locale` (`validateContact(body, words, ctx.locale)`), então o 422 já vem no idioma. O `CatalogCache` carrega as linhas uma vez e monta **uma `CatalogView` por idioma** (texto: pedido → pt-BR → en → qualquer); `onWrite` zera tudo. Perfil, página de esporte, Hall e hoje na história expõem `contentLocale` (idioma em que o conteúdo veio de fato). Rótulos de organização via `textFor(ORG_LABELS_MESSAGES, locale)`.

**Páginas (SSR, doc 12)** no mesmo servidor e porta: `createApp({ web })` monta `src/web/web-handler.ts` depois da API. Produção: `/assets/*` de `apps/web/dist/client` com `Cache-Control: immutable`, arquivos públicos, e todo outro GET vai ao `render()` de `dist/server/entry-server.js` (assets do `.vite/manifest.json`, `web-assets.helper.ts`). Dev (`WEB_DEV=1`, `src/web/vite-dev.ts`): um `http.Server` com os middlewares do Vite (módulos, HMR) antes do Hono; o `entry-server.tsx` é carregado por `ssrLoadModule` a cada requisição (edição sem restart). O renderer chama a API **em processo** (`app.fetch`), com os cookies da página. `/api/*` nunca cai no SSR (404 JSON).
**Cache de HTML** (`web/html-cache.ts`): página anônima (sem cookie do app `was_session`/`was_fixture`/`was-theme` nem cookie do Better Auth `was.*`, sem `?as=`/`?fixture=`, fora de `/admin` e `/me`, status 200) sai com `Cache-Control: public, max-age=0, s-maxage=300, stale-while-revalidate=86400`, `ETag` fraco dos bytes (inclui o nonce) e 304 em `If-None-Match`; em produção fica também num LRU em processo (`SSR_CACHE_TTL_SECONDS`, padrão 60 s, 300 entradas) que é **zerado em qualquer escrita** do `BaseRepository` (hook `onWrite`). O resto sai `private, no-cache` e em streaming. Sempre `Vary: Cookie, Accept-Language` e `Content-Language`. O idioma (cookie `was_locale` → Accept-Language) é variante **cacheável**, não pessoal: entra na chave do LRU (`pt-BR|/athletes`) e nunca torna a página privada. Página servida do cache reaproveita o nonce gravado no corpo (o header CSP é montado depois do handler).
**SEO** (`web/seo.route.ts`, helpers em `@was/shared` `seo/`): `/robots.txt` (bloqueia `/admin`, `/me`, `/api/`, URLs com `q=`/`as=`/`fixture=`) e `/sitemap.xml` (índice) → `/sitemaps/static.xml`, `/sitemaps/athletes.xml`, `/sitemaps/sports.xml`, com `lastmod` = `updated_at` do catálogo (`CatalogView.sitemapEntries()`) e URLs absolutas de `PUBLIC_URL`.
**Log:** as chamadas da API feitas pelo SSR levam `x-was-ssr: 1` e aparecem como `[http]   ssr→api GET …` logo antes da linha da página.
**CSP dividida** (`middlewares/secure-headers.middleware.ts`): `/api` com `default-src 'none'`; páginas com nonce por requisição (`script-src 'self' 'nonce-…'`, `style-src 'self' fonts.googleapis.com 'nonce-…'`, `style-src-attr 'unsafe-inline'`, `img-src` Wikimedia + `lh3.googleusercontent.com` (foto do Google), `font-src` gstatic, `frame-ancestors 'none'`, `base-uri`/`form-action 'self'`); em dev soma `'unsafe-inline'` em estilos, `ws:` e `worker-src blob:` (HMR do Vite).
A rota gerada faz, para qualquer endpoint: regra de acesso (`accessDenial` do shared: 401/403/banido) → rate limit (`RATE_LIMITS` do shared) → `params/query/body` validados pelos schemas do contrato (422 `{ error, message, errors: { 'campo': msg } }`) → handler → `contract.response.safeParse` (deriva do contrato = 500 + log, nunca payload errado).

Leituras do catálogo (atletas, esportes, organizações, calendário…) usam um **snapshot em memória** (`CatalogCache`), invalidado **automaticamente** pelo `BaseRepository` (hook `onWrite`, disparado após o commit) quando qualquer tabela do catálogo é escrita. Participação (votos, comentários, notificações, inbox, auditoria) é sempre consultada ao vivo. Futuro: materialized views (`mv_athlete_summary`, doc 03).

## Como adicionar um endpoint
1. Contrato em `packages/shared/src/contracts/*.contract.ts` (`defineContract({ method, path, access, params?, query?, body?, response })`) + schemas em `schemas/`. Regra de negócio nova → helper puro em `shared/helpers` com teste (o front usa a mesma).
2. No módulo: `defineRoute(MinhaApi.x, async ({ params, query, body }, ctx) => service(ctx, …), { rateLimit: 'comment' })` em `<feature>.route.ts`. `input` já vem validado/tipado pelo contrato; `ctx.user` existe quando `access` ≠ public.
3. Escrita: `ctx.deps.repo.insert|update|softDelete(table, …, ctx.actor, { summary, reason })` (versão + `entity_versions` + `audit_logs` automáticos). Decisão de admin: `repo.audit(actor, AdminAuditAction.X, entity, { target, reason })`. Dentro de `repo.transaction(fn)` use só o `repo` recebido (PGlite tem uma conexão: consultar `deps.db` lá dentro trava).
4. Adicione a rota em `routes.ts` se for módulo novo. O teste `contracts.test.ts` falha se algum contrato ficar sem rota; para GET, acrescente o input em `GET_INPUTS` e ele valida a resposta contra o schema.

## Banco, migrations e seed
| Comando | O que faz |
|---|---|
| `pnpm db:generate` | `drizzle-kit generate` a partir de `packages/db/src/schema.ts` (migration nova deve terminar com `SELECT protect_all_tables();`) |
| `pnpm db:migrate` | aplica as migrations (o servidor também migra no boot: `MIGRATE_ON_BOOT=1`) |
| `pnpm db:seed` | migra + config (níveis, tiers) + **protótipo** (`plan/front-prototype/mock`, via `scripts/fixtures/prototype-loader.mjs`, o mesmo loader do exportador de fixtures). Idempotente: upsert pela chave natural (1º índice único da tabela) ou pelo id determinístico |
| `pnpm db:reset` | **apaga** `.data/pglite` e roda o seed (nunca toca `DATABASE_URL`) |

- O seed depende de `plan/` (gitignored). Sem ele, só a configuração é semeada e o app sobe com o banco vazio (listas vazias, perfis 404).
- **PGlite é monoprocesso**: pare o `pnpm dev` antes de `db:seed`/`db:migrate` no mesmo `.data/pglite`.
- Soft delete only: `DELETE` físico dispara exceção (trigger `forbid_delete`). Em produção, somar o role sem `DELETE` (doc 05).

## Login (Google via Better Auth) e sessão simulada
- `auth/better-auth.config.ts` (`better-auth` 1.7.17): drizzle adapter sobre `users` (`name→displayName`, `image→avatarUrl`) + `auth_sessions`/`auth_accounts`/`auth_verifications` (efêmeras, isentas do `forbid_delete` via `forbid_delete_exempt`), ids uuid v7, cookies `was.*` (HttpOnly, Lax, Secure em produção), só Google (`prompt: select_account`). Montado em `/api/auth/*` antes do session middleware. Hooks: conta nova → `locale` do cookie `was_locale`, `emailVerifiedAt`, papel por `ADMIN_EMAILS`, auditoria; sessão → IP só como `ip_hash`.
- `AuthProvider` = `composite.provider.ts`: Better Auth (`getSession` → `loadAuthUser` → regra de aceite) e, só com `AUTH_SIMULATED`, o simulado (`x-was-session`/cookie `was_session`/`?as=` → contas demo). Termos/Privacidade da versão atual não aceitos = sessão **pendente** (anônima para o acesso; `GET /api/session.pendingConsent`). `POST /api/account/consent` grava terms/privacy/age_declaration com `ip_hash` (409 `consent_outdated` se a versão não for a atual).
- Rota não pública com e-mail não verificado → 403 `email_unverified`. Exclusão de conta apaga as sessões/contas do Better Auth. `ADMIN_EMAILS` promove no boot (idempotente, auditado).
- Sem `GOOGLE_CLIENT_ID/SECRET` o app sobe com aviso; `GET /api/session.googleEnabled=false` e o diálogo diz "Login com Google não configurado".
- **Testar o aceite sem Google:** `pnpm dev:api`, escolha "Leitor com conta" ou `?as=admin`: as contas demo do banco local foram semeadas com a Privacidade 0.1 e caem no aceite. Depois de aceitar, para repetir: `pnpm db:reset` (resemeia já aceitas) e, para forçar de novo, suba a versão em `LEGAL_DOCUMENT_VERSIONS`.
- Google de verdade: Console do Google Cloud → OAuth client "Aplicativo da Web" com origem `http://localhost:8787` e redirect `http://localhost:8787/api/auth/callback/google`; preencha `.env` (veja `.env.example`) e reinicie.

## Variáveis de ambiente (todas opcionais em dev; `.env` na raiz é carregado no boot, veja `.env.example`)
| Var | Padrão | Uso |
|---|---|---|
| `PORT` / `HOST` | `8787` / `127.0.0.1` | servidor |
| `DATABASE_URL` | — | Postgres (node-postgres); sem ela, PGlite |
| `PGLITE_DATA_DIR` | `.data/pglite` | dir do PGlite (relativo à raiz) ou `memory://` |
| `CORS_ORIGINS` | `http://localhost:8787,http://127.0.0.1:8787` | origens aceitas em `/api` (as páginas são da mesma origem) |
| `IP_HASH_SALT` | `dev-only-salt` | sal do `ip_hash`; **obrigatório em produção** (16+ caracteres, diferente do de dev) |
| `RATE_LIMIT_ENABLED` / `LOG_REQUESTS` / `MIGRATE_ON_BOOT` | `1` | liga/desliga |
| `MIGRATIONS_DIR` | ao lado do módulo | pasta das migrations (o build copia para `dist/migrations`) |
| `WEB_DEV` | `0` (`pnpm dev` põe `1`) | Vite em middleware mode no mesmo processo (SSR + HMR) |
| `WEB_DIST_DIR` | `apps/web/dist` | build do web (`client/` + `server/entry-server.js`); sem ele, só a API (aviso no boot) |
| `APP_TIME_ZONE` | `America/Sao_Paulo` | "hoje" das páginas (calendário, hoje na história, idades) |
| `PUBLIC_URL` | `http://localhost:<PORT>` | origem dos links canonical/og, JSON-LD, sitemap e robots |
| `BETTER_AUTH_URL` | `PUBLIC_URL` | origem do Better Auth (callback do Google = `<url>/api/auth/callback/google`) |
| `BETTER_AUTH_SECRET` | valor fixo de dev | 32+ caracteres; **obrigatório em produção** (com ou sem Google) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | — | OAuth do Google (os dois, ou o login fica desligado) |
| `ADMIN_EMAILS` | — | e-mails promovidos a admin (boot e primeiro login) |
| `AUTH_SIMULATED` | `1` fora de produção | perfis demo (`x-was-session`); proibido em produção (o boot falha) |
| `SSR_CACHE_TTL_SECONDS` | `60` | produção: TTL do cache de HTML anônimo em processo (`0` desliga; dev nunca usa) |
| Web: `VITE_DATA_SOURCE=http` | fixtures | páginas leem a API real (vale no dev e no build) |

## Rodar e testar
Tudo em http://localhost:8787: `pnpm dev:api` (páginas com a API real) · `pnpm dev` (páginas com fixtures) · `pnpm --filter server test` (PGlite em memória: conformidade de todo GET + regras das mutações + páginas/CSP em `test/web.test.ts`) · `pnpm build && pnpm start` (`NODE_ENV=production node apps/server/dist/main.js`; para dados reais: `VITE_DATA_SOURCE=http pnpm build`; exige `IP_HASH_SALT` e `BETTER_AUTH_SECRET`).

## Deploy (imagem Docker; hospedagem ainda não escolhida)
- `Dockerfile` na raiz (multi-stage, `node:26-slim` por digest): `pnpm fetch` + install offline → `pnpm build` com `VITE_DATA_SOURCE=http` → `pnpm --filter server deploy --prod --legacy /out` (o pnpm 10+ exige `--legacy` sem `inject-workspace-packages`; os `@was/*` já vão dentro do `main.js`).
- Runtime em `/app`: `main.js` (+ `.map`, `--enable-source-maps`), `migrations/` (o padrão do bundle: ao lado do `main.js`), `web/client` e `web/server` (SSR autocontido), `node_modules/` de produção. ENV: `NODE_ENV=production HOST=0.0.0.0 PORT=8787 WEB_DIST_DIR=/app/web MIGRATIONS_DIR=/app/migrations PGLITE_DATA_DIR=/data/pglite`. Código do root (só leitura), `/data` do usuário `node` (VOLUME), HEALTHCHECK com `fetch` em `/api/health`.
- Em produção o boot falha sem `IP_HASH_SALT`/`BETTER_AUTH_SECRET` ou com `AUTH_SIMULATED` ligado. Defina também `PUBLIC_URL`, `BETTER_AUTH_URL` e `CORS_ORIGINS` com a origem pública.
- `node_modules` da imagem inclui ferramentas de dev (drizzle-kit, vitest, vite/esbuild, ~80 MB) porque o lockfile resolve os peers opcionais do `better-auth` com as devDependencies do workspace; o servidor não as carrega (follow-up no doc 22).
- CI: `scripts/ci/smoke.sh` sobe `dist/main.js` em produção (PGlite em memória) e confere `/api/health`, `/`, `/athletes` (`<h1`) e `/robots.txt`; o job `docker` roda o mesmo smoke contra o container.

## Desvios dos docs (fase 1)
- Uma tabela por agregado em `tables/*.table.ts` (tabela + traduções), não um arquivo por tabela.
- Rate limit em memória por processo (stub); produção: `hono-rate-limiter` com store compartilhado.
- Sem `change_requests` ainda: as propostas do A1 são `field_conflicts` + `ai_extraction_queue` (+ valores extraídos por IA em `field_provenance`).
- `legal_acceptances(document_kind, version)` no lugar de `user_consents.document_id` (os textos legais vivem no shared); `user_consents` guarda as finalidades opcionais.
- Contadores (likes, respostas, votos do usuário) sobem `version` mas não geram snapshot/auditoria (dado derivado).
- "Rodar agora" (A2) é simulado até existir `packages/ingest`.
- Cache de HTML só para visitante anônimo; o nonce fica fixo enquanto a página estiver em cache (CDN/LRU). Purge por URL na CDN ainda não existe (a CDN expira em 5 min).
