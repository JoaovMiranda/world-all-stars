# World All Stars

A enciclopédia dos maiores campeões de todos os esportes.

## Estrutura
| Pasta | O que é |
|---|---|
| [`plan/`](plan/README.md) | Planejamento: handoffs (`plan/docs`), protótipo HTML de referência (`plan/front-prototype`) e pesquisa (`plan/pesquisa`) |
| *(raiz)* | Código de verdade, seguindo o monorepo do [handoff 06](plan/docs/06-arquitetura-monorepo.md): `apps/web`, `apps/server`, `packages/*` |

## Como rodar
Requisitos: Node 22+ (o CI e a imagem usam o 26, `.nvmrc`) e pnpm 11 (`npm i -g pnpm@11.13.0`; o Node 26 não traz corepack). Nenhum serviço externo: o banco é PGlite embutido (`.data/pglite`, gitignored).

```bash
pnpm install          # monorepo (pnpm workspaces)
pnpm db:seed          # migra + semeia o banco local com o mock DB do protótipo (precisa de plan/; idempotente)
pnpm dev              # http://localhost:8787: páginas com SSR + /api num só processo (Hono + Vite em middleware, HMR), dados de fixtures
pnpm dev:api          # o mesmo, mas as páginas leem a API real (VITE_DATA_SOURCE=http; no SSR a API é chamada em processo)
pnpm typecheck        # tsc em todos os pacotes
pnpm test             # Vitest: shared, db (seed), server (PGlite em memória), web (inclui smoke de SSR)
pnpm build && pnpm start   # apps/web/dist (client + server/entry-server.js) + apps/server/dist/main.js, em http://localhost:8787
                           # (produção exige IP_HASH_SALT e BETTER_AUTH_SECRET no .env ou no shell, e AUTH_SIMULATED desligado)
```
- Fonte de dados do web: **fixtures** por padrão (`?fixture=sample|empty|loading|error`, guardado no cookie `was_fixture`); `VITE_DATA_SOURCE=http` usa a API (no build também: `VITE_DATA_SOURCE=http pnpm build`). Sessão simulada nos dois modos: `?as=anon|reader|admin` (cookie `was_session`; na API vira o header `x-was-session`).
- SSR (doc 12): o servidor renderiza cada página com os dados já no HTML; o tema vem do cookie `was-theme`. Variáveis: `APP_TIME_ZONE` (padrão `America/Sao_Paulo`), `PUBLIC_URL` (canonical/og), `WEB_DIST_DIR` (padrão `apps/web/dist`). Sem build do web, `pnpm start` sobe só a API. SEO: `/robots.txt`, `/sitemap.xml` e JSON-LD nas páginas; HTML anônimo com cache público + ETag (privado com cookies do app).
- Login: só Google (Better Auth). Copie `.env.example` para `.env` e preencha `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth client "Aplicativo da Web": origem `http://localhost:8787`, redirect `http://localhost:8787/api/auth/callback/google`) e `ADMIN_EMAILS`. Sem credenciais o app sobe e o diálogo avisa "Login com Google não configurado"; em dev os perfis simulados continuam (`AUTH_SIMULATED`, proibido em produção).
- Banco: `DATABASE_URL=postgres://…` troca o PGlite por Postgres. `pnpm db:migrate`, `pnpm db:generate`, `pnpm db:reset` (apaga e recria o PGlite local). Pare o `pnpm dev` antes de semear (PGlite é monoprocesso).
- Detalhes: [`apps/web/FRONTEND.md`](apps/web/FRONTEND.md) e [`apps/server/BACKEND.md`](apps/server/BACKEND.md).

## CI e Docker
- **CI** (`.github/workflows/ci.yml`, em PR e push para `development`/`main`): job `verify` roda `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` (sem `plan/`: os testes do protótipo pulam), `VITE_DATA_SOURCE=http pnpm build`, o smoke da build de produção e `pnpm audit --prod --audit-level=high`; job `docker` constrói a imagem (sem push) e roda o mesmo smoke contra o container. Actions fixadas por SHA.
- **Smoke local** (o mesmo do CI; sobe na porta 8799 com PGlite em memória e segredos fictícios): `VITE_DATA_SOURCE=http pnpm build && bash scripts/ci/smoke.sh`. Contra um servidor já no ar: `BASE_URL=http://localhost:8787 bash scripts/ci/smoke.sh`.
- **Docker** (sem hospedagem escolhida ainda): imagem `node:26-slim` fixada por digest, usuário `node`, porta 8787, PGlite no volume `/data`, HEALTHCHECK em `/api/health`.
  ```bash
  docker build -t world-all-stars .
  # .env.production (fora do git): IP_HASH_SALT, BETTER_AUTH_SECRET, PUBLIC_URL, BETTER_AUTH_URL, CORS_ORIGINS,
  # GOOGLE_CLIENT_ID/SECRET, ADMIN_EMAILS e AUTH_SIMULATED=0 (veja .env.example)
  docker run -d --name was -p 8787:8787 --env-file .env.production -v was-data:/data world-all-stars
  ```
  O banco começa vazio (as migrations rodam no boot). Para Postgres, passe `DATABASE_URL` e o volume deixa de ser necessário.

| Pasta | O que tem |
|---|---|
| `apps/web` | React 19 + Vite, TanStack Router/Query (SSR com streaming), Tailwind v4 |
| `apps/server` | Hono: rotas geradas dos contratos do shared, módulos por feature |
| `packages/db` | Drizzle (schema do doc 03, migrations, BaseRepository, seed) |
| `packages/shared` | Contratos da API, schemas Zod, enums, consts, regras de negócio puras (BE + FE), tokens de tema |
