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
pnpm dev              # Turborepo: web (Vite, http://localhost:5173, dados de fixtures) + API (Hono, http://localhost:8787/api)
pnpm dev:api          # o mesmo, mas o web lê a API real (VITE_DATA_SOURCE=http, proxy /api → :8787)
pnpm typecheck        # tsc em todos os pacotes
pnpm test             # Vitest: shared, db (seed), server (PGlite em memória), web
pnpm build && pnpm start   # web/dist + apps/server/dist/main.js
```
- Fonte de dados do web: **fixtures** por padrão (`?fixture=sample|empty|loading|error`); `VITE_DATA_SOURCE=http` usa a API. Sessão simulada nos dois modos: `?as=anon|reader|admin` (na API vira o header `x-was-session`).
- Banco: `DATABASE_URL=postgres://…` troca o PGlite por Postgres. `pnpm db:migrate`, `pnpm db:generate`, `pnpm db:reset` (apaga e recria o PGlite local). Pare o `pnpm dev` antes de semear (PGlite é monoprocesso).
- Detalhes: [`apps/web/FRONTEND.md`](apps/web/FRONTEND.md) e [`apps/server/BACKEND.md`](apps/server/BACKEND.md).

| Pasta | O que tem |
|---|---|
| `apps/web` | React 19 + Vite, TanStack Router/Query, Tailwind v4 |
| `apps/server` | Hono: rotas geradas dos contratos do shared, módulos por feature |
| `packages/db` | Drizzle (schema do doc 03, migrations, BaseRepository, seed) |
| `packages/shared` | Contratos da API, schemas Zod, enums, consts, regras de negócio puras (BE + FE), tokens de tema |
