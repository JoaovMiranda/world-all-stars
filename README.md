# World All Stars

A enciclopédia dos maiores campeões de todos os esportes.

## Estrutura
| Pasta | O que é |
|---|---|
| [`plan/`](plan/README.md) | Planejamento: handoffs (`plan/docs`), protótipo HTML de referência (`plan/front-prototype`) e pesquisa (`plan/pesquisa`) |
| *(raiz)* | Código de verdade, seguindo o monorepo do [handoff 06](plan/docs/06-arquitetura-monorepo.md): `apps/web`, `apps/server`, `packages/*` |

## Como rodar
Requisitos: Node 22+ (testado no 26) e pnpm 11 (`corepack enable` ou `npm i -g pnpm`). Nenhum serviço externo: o banco é PGlite embutido (`.data/pglite`, gitignored).

```bash
pnpm install          # monorepo (pnpm workspaces)
pnpm db:seed          # migra + semeia o banco local com o mock DB do protótipo (precisa de plan/; idempotente)
pnpm dev              # http://localhost:8787: páginas com SSR + /api num só processo (Hono + Vite em middleware, HMR), dados de fixtures
pnpm dev:api          # o mesmo, mas as páginas leem a API real (VITE_DATA_SOURCE=http; no SSR a API é chamada em processo)
pnpm typecheck        # tsc em todos os pacotes
pnpm test             # Vitest: shared, db (seed), server (PGlite em memória), web (inclui smoke de SSR)
pnpm build && pnpm start   # apps/web/dist (client + server/entry-server.js) + apps/server/dist/main.js, em http://localhost:8787
```
- Fonte de dados do web: **fixtures** por padrão (`?fixture=sample|empty|loading|error`, guardado no cookie `was_fixture`); `VITE_DATA_SOURCE=http` usa a API (no build também: `VITE_DATA_SOURCE=http pnpm build`). Sessão simulada nos dois modos: `?as=anon|reader|admin` (cookie `was_session`; na API vira o header `x-was-session`).
- SSR (doc 12): o servidor renderiza cada página com os dados já no HTML; o tema vem do cookie `was-theme`. Variáveis: `APP_TIME_ZONE` (padrão `America/Sao_Paulo`), `PUBLIC_URL` (canonical/og), `WEB_DIST_DIR` (padrão `apps/web/dist`). Sem build do web, `pnpm start` sobe só a API.
- Banco: `DATABASE_URL=postgres://…` troca o PGlite por Postgres. `pnpm db:migrate`, `pnpm db:generate`, `pnpm db:reset` (apaga e recria o PGlite local). Pare o `pnpm dev` antes de semear (PGlite é monoprocesso).
- Detalhes: [`apps/web/FRONTEND.md`](apps/web/FRONTEND.md) e [`apps/server/BACKEND.md`](apps/server/BACKEND.md).

| Pasta | O que tem |
|---|---|
| `apps/web` | React 19 + Vite, TanStack Router/Query (SSR com streaming), Tailwind v4 |
| `apps/server` | Hono: rotas geradas dos contratos do shared, módulos por feature |
| `packages/db` | Drizzle (schema do doc 03, migrations, BaseRepository, seed) |
| `packages/shared` | Contratos da API, schemas Zod, enums, consts, regras de negócio puras (BE + FE), tokens de tema |
