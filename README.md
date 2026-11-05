# World All Stars

A enciclopédia dos maiores campeões de todos os esportes.

## Estrutura
| Pasta | O que é |
|---|---|
| [`plan/`](plan/README.md) | Planejamento: handoffs (`plan/docs`), protótipo HTML de referência (`plan/front-prototype`) e pesquisa (`plan/pesquisa`) |
| *(raiz)* | Código de verdade, seguindo o monorepo do [handoff 06](plan/docs/06-arquitetura-monorepo.md): `apps/web`, `apps/server`, `packages/*` |

## Como rodar
Requisitos: Node 22+ e pnpm 11 (`corepack enable` ou `npm i -g pnpm`).

```bash
pnpm install          # instala o monorepo (pnpm workspaces)
pnpm dev              # Turborepo sobe o apps/web (Vite) em http://localhost:5173
pnpm typecheck        # tsc em todos os pacotes
pnpm build            # build de produção (apps/web/dist)
```

Hoje só a **home** existe, lendo dados de um adaptador *fixture* que devolve o banco **vazio**
(`apps/web/src/modules/home/home.service.ts`; trocar por `createHttpHomeAdapter('/api/home')` quando houver servidor).
Parâmetros de teste na URL da home: `?fixture=empty` (padrão) · `?fixture=loading` · `?fixture=error` · `?date=2026-06-30`.

| Pasta | O que tem |
|---|---|
| `apps/web` | React 19 + Vite, TanStack Router/Query, Tailwind v4 |
| `packages/shared` | Tokens de tema (`theme.css`), enums, consts, schemas Zod e helpers compartilhados |

## Próximo passo
Construir primeiro o **front** (`apps/web`: React + Vite com SSR no Hono), usando como referência:
- Telas e comportamento: [`plan/front-prototype`](plan/front-prototype/index.html) e o [09 · Telas](plan/docs/09-telas.md).
- Visual: [08 · Design system](plan/docs/08-design-system.md) (v3.1 "Noite de gala": tokens em `plan/front-prototype/assets/css/tokens.css`).
- Stack e convenções: [04](plan/docs/04-stack-tecnica.md), [06](plan/docs/06-arquitetura-monorepo.md), [07](plan/docs/07-convencoes-de-codigo.md).
