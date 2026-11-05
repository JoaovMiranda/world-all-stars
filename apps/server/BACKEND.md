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
  auth/                              AuthProvider (interface) + simulated-auth.provider (x-was-session)
  middlewares/                       error, request-log, rate-limit (stub), session (AuthProvider + ip_hash + actor)
  modules/<feature>/                 *.route.ts (contrato → handler) · *.service.ts (regras) · *.repository.ts (Drizzle)
  modules/catalog/                   snapshot do catálogo em memória + CatalogView (linhas → views dos contratos)
  routes.ts                          ALL_ROUTES (um teste garante: todo contrato servido exatamente uma vez)
```
Fluxo de uma requisição: `requestLog → secureHeaders → cors → session (AuthProvider) → rota gerada do contrato`.
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

## Sessão simulada → Better Auth
Hoje `createSimulatedAuthProvider` lê `x-was-session: anon|reader|admin` (ou cookie `was_session`, ou `?as=`) e mapeia para as contas demo `DEMO_SESSION_EMAILS` do shared; o tipo efetivo segue o `role` da conta (admin rebaixado vira reader). O web manda o header em modo http (`http-client.helper.ts`). Para Better Auth: implementar `AuthProvider.resolve()` com `auth.api.getSession({ headers })` → `loadAuthUser(db, { id })`, montar `/api/auth/*` e passar `createApp({ auth })`. Nada mais muda (rotas, acesso e actor já usam a interface).

## Variáveis de ambiente (todas opcionais em dev)
| Var | Padrão | Uso |
|---|---|---|
| `PORT` / `HOST` | `8787` / `127.0.0.1` | servidor |
| `DATABASE_URL` | — | Postgres (node-postgres); sem ela, PGlite |
| `PGLITE_DATA_DIR` | `.data/pglite` | dir do PGlite (relativo à raiz) ou `memory://` |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | origens do Vite |
| `IP_HASH_SALT` | `dev-only-salt` | sal do `ip_hash` (segredo em produção) |
| `RATE_LIMIT_ENABLED` / `LOG_REQUESTS` / `MIGRATE_ON_BOOT` | `1` | liga/desliga |
| `MIGRATIONS_DIR` | ao lado do módulo | pasta das migrations (o build copia para `dist/migrations`) |
| Web: `VITE_DATA_SOURCE=http`, `API_PROXY_TARGET` | fixtures, `http://localhost:8787` | front lê a API real via proxy `/api` |

## Rodar e testar
`pnpm dev:api` (web em modo http + servidor) · `pnpm dev` (web com fixtures + servidor) · `pnpm --filter server test` (PGlite em memória: conformidade de todo GET + regras das mutações) · `pnpm build && pnpm start` (`node apps/server/dist/main.js`).

## Desvios dos docs (fase 1)
- Uma tabela por agregado em `tables/*.table.ts` (tabela + traduções), não um arquivo por tabela.
- Rate limit em memória por processo (stub); produção: `hono-rate-limiter` com store compartilhado.
- Sem `change_requests` ainda: as propostas do A1 são `field_conflicts` + `ai_extraction_queue` (+ valores extraídos por IA em `field_provenance`).
- `legal_acceptances(document_kind, version)` no lugar de `user_consents.document_id` (os textos legais vivem no shared); `user_consents` guarda as finalidades opcionais.
- Contadores (likes, respostas, votos do usuário) sobem `version` mas não geram snapshot/auditoria (dado derivado).
- "Rodar agora" (A2) é simulado até existir `packages/ingest`. Sem SSR ainda (doc 12).
