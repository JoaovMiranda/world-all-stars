# apps/web · guia para quem constrói telas (fase 2)

Fundação pronta: contratos da API em `@was/shared`, **uma** fábrica de endpoints, fixtures geradas do protótipo, kit de componentes, sessão simulada e rotas de todas as telas. Seu trabalho: **preencher `src/modules/<módulo>/`**. Antes de criar qualquer coisa, procure aqui.

Planejamento (somente leitura): `plan/docs/07` (convenções), `08` (design), `09` (telas), `17`, `19`, `20`, `21`. Referência visual/comportamental: `plan/front-prototype/pages/*`.

## Pastas
```
packages/shared/src/            fonte única (BE + FE): enums · consts · schemas Zod · contracts (método+rota+schemas) · helpers puros (+ testes)
apps/web/src/
  app/                          SSR: entry-server.tsx / entry-client.tsx, create-router.tsx (router + QueryClient por requisição),
                                router.tsx (todas as rotas, lazy por página, loaders + head), root-document (o <html>), root-layout,
                                request-scope.ts (boot da página), route-prefetch.helper.ts, head.helper.ts, styles.css
  data/                         camada de dados genérica
    define-endpoint.helper.ts   defineQuery / defineMutation  (substitui service+adapter+hook)
    endpoints/*.query.ts        UMA definição por endpoint (fixture embutida)
    fixtures/*.fixture.ts       lógica de fixture que precisa de regra (home, comentários, votos, me…)
    demo.store.ts               mutações da demo (memória + localStorage)
    fixture-mode.store.ts       ?fixture=sample|empty|loading|error (padrão sample; cookie was_fixture)
  fixtures/sample/*.json        GERADO por `pnpm fixtures:export` (não edite à mão)
  session/                      useSession() (kind/user do sessionQuery), requireLogin(), signOut(), auth-client (Better Auth, Google), ConsentDialog; perfis simulados no dev
  shared-ui/                    kit de componentes, hooks e helpers de UI genéricos
  modules/<módulo>/             páginas e componentes específicos (+ <módulo>.const.ts com os textos)
```

## Dados
### Usar um endpoint
```tsx
import { athletesQuery } from '@/data/endpoints/athletes.query';
const q = athletesQuery.useQuery({ query: filters });            // typed input/output from the shared contract
const v = tierVotesQuery.useQuery({ params: { slug } }, { enabled: isSignedIn });
await athleteProfileQuery.fetch({ params: { slug } });           // prefetch / loader
const post = postComment.useMutation({ onSuccess: … });           // invalidates related queries automatically
post.mutate({ params: { slug }, body: { body, parentId } });      // errors: ApiError (status + body { error, message, errors })
```
Endpoints prontos (GET exporta `<nome>Query`, ex. `sportsQuery`; mutações pelo nome, ex. `castTierVote`): `home` · `athletes`, `athleteProfile`, `analysisDimensions`, `compare` · `sports`, `sportPage`, `governanceModels`, `organizations` · `hallOfGreats`, `sources`, `collectionRuns`, `calendar`, `onThisDay`, `validationContext` · `session`, `me`, `notifications`, `markNotificationRead` · `tierVotes`, `castTierVote`, `setOfficialTier` · `comments`, `postComment`, `reactToComment`, `deleteComment` · `submitSuggestion`, `submitContact` · conta (E6): `myData`, `updateConsent`, `exportMyData`, `deleteAccount` (`account.query.ts`) · admin (A1–A8, `admin.query.ts`, demo em `fixtures/admin.fixture.ts` com auditoria): `adminSummary`, `adminProposals` + `reviewProposal`, `adminTierSignals`, `adminIngestion` + `runIngestion`, `adminSources` + `updateSource`/`addCollectionLinks`, `adminUsers` + `updateUser`, `adminPrivacy` + `updatePrivacyRequest`, `adminDossiers` + `reviewDossier`, `adminComments` + `moderateComment`/`addBannedWord`/`removeBannedWord`, `adminInbox` + `reviewSuggestion`/`updateContactMessage`.

Toda resposta é validada pelo schema do contrato (`contract.response.parse`): divergência quebra alto. Fonte: fixtures (padrão) ou API real com `VITE_DATA_SOURCE=http` (`pnpm dev:api`; mesma origem: o `apps/server` serve páginas e `/api` em :8787; no SSR a chamada é em processo, `app.fetch`; `VITE_API_BASE_URL` opcional). Em modo http a sessão simulada vai no header `x-was-session`. Regras e composições usadas pelas fixtures (`composeHome`, `buildCommentThreads`, `composeCompare`, `accessDenial`, `adminPendingCounts`, `officialTierChangeError`, `reviewDossierOutcome`) são as mesmas do servidor (`@was/shared`).

### Adicionar um endpoint
1. `packages/shared/src/schemas/<assunto>.schema.ts`: schemas Zod + `z.infer`.
2. Contrato em `packages/shared/src/contracts/*.contract.ts`: `defineContract({ method, path: '/api/...', access, params?, query?, body?, response, summary })`.
3. Se precisa de dado novo do protótipo: adicione o arquivo em `scripts/fixtures/export-prototype-fixtures.mjs` (com o schema) e o tipo em `data/sample-fixtures.type.ts`; rode `pnpm fixtures:export`.
4. `data/endpoints/<domínio>.query.ts`: `export const xQuery = defineQuery(Contract, { sample: ({ input, sample, session }) => …, empty?: 'not-found' | fn })`.
   Mutação: `defineMutation(Contract, handler, { invalidates: [xQuery] })`, gravando em `demoStore`.
O modo **empty** deriva do schema (`emptyOf`); só passe `empty` quando o vazio depende do input ou a entidade não existe (404). Há teste garantindo isso (`empty-response.helper.test.ts`).

### Modos (dev)
`?fixture=sample` (padrão) · `empty` (banco vazio) · `loading` (nunca resolve) · `error` (503). Persistem na aba; seletor discreto no canto inferior esquerdo (só em dev). `?as=anon|reader|admin` força a sessão.

## Construir uma página
```tsx
const route = getRouteApi('/sports/$slug');
export function SportPage() {
  const { slug } = route.useParams();
  const { filters, setFilter, reset, activeCount } = useUrlFilters(SportPageFiltersSchema); // filtros na URL
  const sport = sportPageQuery.useQuery({ params: { slug } });
  return (
    <QueryBoundary query={sport} loading={<SkeletonList rows={6} />}>
      {(s) => (
        <PageLayout title={s.name} eyebrow={T.eyebrow} breadcrumb={[{ label: T.sports, link: { to: '/sports' } }, { label: s.name }]} aside={…}>
          <Section title={T.champions}><AthleteGrid athletes={…} emptyTitle={T.noChampions} /></Section>
        </PageLayout>
      )}
    </QueryBoundary>
  );
}
```
Troque o `StubPage` do módulo pela página real; a rota já existe em `app/router.tsx` (search params tipados pelos schemas de `@was/shared`).

## SSR (doc 12)
Toda página é renderizada pelo `apps/server` (Hono) com TanStack Router SSR (streaming) e hidratada no navegador. Uma porta: http://localhost:8787 (`pnpm dev` com fixtures, `pnpm dev:api` com a API; Vite roda em middleware dentro do servidor, com HMR).
- **Loader só faz prefetch** e devolve o `PageMeta` do `<head>`: `prefetchQueries(context.queryClient, [xQuery.queryOptions(input)])`; a entidade principal usa `ensureOr404` (404 → `notFound()`, HTTP 404). Nunca espera `?fixture=loading`; fixtures sem latência no servidor.
- **A query key do loader e da página vem do mesmo helper** (`home-query.helper.ts`, `athletes-query.helper.ts`, `sports-query.helper.ts`): se divergir, a hidratação mostra skeleton/erro. Página nova pública = loader + helper de input + `head`.
- **Nada de `window`/`document`/`localStorage`/`new Date()` na renderização.** "Hoje" é `useToday()` (`app/use-boot.hook.ts`, `APP_TIME_ZONE` do servidor); instantes com hora usam `instantFormat()` (`format.helper.ts`). Efeitos (`useEffect`) podem usar o navegador.
- Estado que o servidor precisa saber fica em cookie: `was_fixture`, `was_session`, `was-theme`, `was_locale` (o `<html data-theme>` já sai certo, sem script inline). Lido no `boot` (`request-scope.ts`): `AsyncLocalStorage` no servidor, módulo no cliente.
- Componente só de navegador: `<ClientOnly fallback={caixa do mesmo tamanho}>` (globo). `ChartContainer` já só desenha em efeito.
- CSP com nonce por requisição: script inline só com `nonce` (o router e o React já põem).
- **Head:** o loader devolve `PageMeta` (`title`, `description`, `image` → og:image, `noindex`, `jsonLd`). JSON-LD só pelos helpers de `@was/shared` (`webSiteJsonLd`, `organizationJsonLd`, `athleteJsonLd`, `sportJsonLd`, `breadcrumbJsonLd`, `itemListJsonLd`); sai em `<script type="application/ld+json" nonce>`. 404 e erro ganham título próprio + `noindex` na rota raiz.
- **Página nova:** `lazyPage('<módulo>/<arquivo>', 'ExportName')` (registra o módulo em `staticData.pageModule`: o servidor faz `modulepreload` do chunk da rota).
- Teste: `src/app/entry-server.test.ts` (200 + `<h1>` + estado desidratado + nonce; 404 com título; JSON-LD válido; preload do chunk).

## Idiomas (pt-BR, en, es na mesma URL, doc 12)
A tradução troca **no lugar**: o seletor (`LanguageSwitcher`, cabeçalho) grava o cookie `was_locale` (1 ano), muda `<html lang>`, re-renderiza e chama `router.invalidate()` (títulos do `head()` e dados da API no idioma). A URL não muda. O SSR resolve cookie → Accept-Language → pt-BR no `boot.locale`.
- **Convenção:** `x.const.ts` mantém o objeto pt-BR (`X_TEXT`, fonte) e exporta `X_MESSAGES = defineMessages(X_TEXT, { en: X_TEXT_EN, es: X_TEXT_ES })`; ao lado ficam `x.const.en.ts` e `x.const.es.ts` com `satisfies Messages<typeof X_TEXT>` (mesmas chaves, mesmas assinaturas). Rotas e dados ficam **fora** do dicionário (`NAV_ITEMS = [{ to, labelKey }]`).
- **Componente:** `const t = useText(HOME_MESSAGES).intro` (`@/i18n/use-text.hook`). Fora de componente (helper chamado no render, loader/head): `currentText(X_MESSAGES)`. Documentos longos (legal, "Como escolhemos"): mapa por idioma lido com `useLocalized(LEGAL_DOCS)` / `currentLocalized`.
- **Formatação:** `useFormat()` (data, dia e mês, mês, número, %, intervalo, "há 3 dias", plural, collator `fmt.compare`, país, idioma) com o `APP_TIME_ZONE`; `formatDate`/`instantFormat`/`formatRelativeDay` leem o idioma atual. Nada de `'pt-BR'` fixo nem `localeCompare` sem collator.
- `useMemo`/`useCallback` que usam textos devem ter o `t` nas dependências (a resposta pode ser a mesma referência em outro idioma).
- **Dados:** a query key termina com o locale; trocar de idioma mantém a resposta anterior até a nova chegar (sem skeleton). O http-client manda `x-was-locale`. Respostas de detalhe trazem `contentLocale`; `PageLayout contentLocale={…}` mostra a `UntranslatedNote` quando difere do idioma da interface. Fixtures dizem `contentLocale: 'pt-BR'`.
- **Teste:** `src/i18n/messages-coverage.test.ts` (todo `*_MESSAGES`: mesmas chaves, aridade, sem string vazia, en/es traduzidos; documentos com a mesma estrutura).

## Catálogo (`src/shared-ui`)
| Componente | Uso |
|---|---|
| `PageLayout` | `<PageLayout title breadcrumb eyebrow lead badges actions headerExtra aside>` esqueleto de toda página (o `<title>` vem do `head` da rota) |
| `PageHeader`, `Breadcrumb` | usados pelo PageLayout; `breadcrumb: [{ label, link?: { to, params } }]` |
| `Section` | `<Section title eyebrow actions variant="card|gold|mythic|plain" span={4|8|12}>` card + card-head |
| `QueryBoundary` | `<QueryBoundary query isEmpty empty loading notFound>{(data) => …}</QueryBoundary>` (401 → entrar, 404, erro com retry) |
| `EmptyState` / `ErrorState` / `Skeleton`, `SkeletonList` | estados vazios/erro/carregando |
| `StubPage` | placeholder "Em construção" (`gate="reader|admin"`) |
| `RequireSession` | `<RequireSession role="admin">` para páginas de conta/admin |
| `Button` / `ButtonLink` | `variant="primary|secondary|ghost|link|danger" size="sm|md|lg|icon"`; ButtonLink = Link tipado |
| `Tag`, `TierTag`, `LevelTag`, `Medal`, `SportDot` | selos (`tone`), tier com borda metálica, nível, medalha, ponto do esporte |
| `Chip`, `ChipToggleGroup` | `<ChipToggleGroup label options value onChange multiple?>` |
| `FormField` + `Input`/`Select`/`Textarea` + `CharCounter` | `<FormField label hint error required counter={<CharCounter value max/>}>{(p) => <Textarea {...p} {...form.register('body')} />}</FormField>` |
| `useForm` | `useForm({ schema: createCommentInputSchema(ctx.bannedWords), initialValues })` → `values, register, setValue, errors, handleSubmit, setServerErrors(e.body.errors), formRef` |
| `FilterBar` + `useUrlFilters(schema)` | filtros na URL (`?q=&sport=…`), `resultCount`, "Limpar filtros" |
| `SearchInput` | campo pílula (⌕); a busca global é `SearchRow` (atalho `/`) |
| `Tabs` | ARIA tabs controladas: `value`/`onChange` ligados a `useUrlFilters(AthleteProfileSearchSchema)` (`?tab=`) |
| `DataTable` | `columns [{ key, header, cell, sortValue?, align? }]`, `rows`, `rowKey`, `caption` (aria-sort, linha vazia) |
| `StatTile` + `KpiGrid` | KPIs (`<KpiGrid columns={4}><StatTile label value hint/></KpiGrid>`) |
| `Avatar` | foto por link com anel do tier e iniciais de fallback (`referrerPolicy=no-referrer`) |
| `AthleteCard`, `AthleteGrid` | card clicável → perfil; grade com estado vazio |
| `SportCard` | card inteiro clicável → `/sports/$slug`, associações com link Wikipedia (`showAssociations`; opcionais `associations` = lista já escolhida, `associationsLabel`, `tags`, `footer` com links clicáveis) |
| `OrgLogo`, `OrgName`, `OrgInfo`, `OrgRow`, `OrgMini` | organizações (doc 19); `OrgRow` traz o ⓘ (disclosure); opcionais `lead`, `tags`, `children` (árvore aninhada), `className` |
| `EventRow`, `EventList` | campeonatos/dias do esporte (home, dia do calendário, "Próximos campeonatos") |
| `Timeline` | linha do tempo com losangos (`tone="gold"` para conquista) |
| `Notice` | aviso inline (`tone`, `live`) |
| `Dialog`, `LoginDialog`, `GoogleButton` | modal nativo (foco preso, Esc, foco volta; `dismissible={false}` = bloqueante); login com Google (estado "não configurado" sem credenciais; "Simular entrada" só com simulação) |
| `DateLink` | toda data vira link para `/on-this-day/$md` |
| `SourceInfo` | ⓘ da fonte de um campo |
| `ChartContainer` | `<ChartContainer ariaLabel option={useCallback(({ cssVar, axis }) => ({…}), deps)} summary/>` ECharts lazy, cores dos tokens, re-render no tema |
| `Pagination` | paginação numerada |
| `DocumentPageLayout` + `DocBlocks` | páginas longas (legal, acessibilidade, critérios): `<DocumentPageLayout title lead sections version effectiveAt updatedAt notice>`; seções `{ id, title, blocks: [{ kind: 'p'|'list'|'table'|'defs'|'notice' }], children }` com sumário fixo; `withSectionExtras(sections, { id: <jsx/> })` (`document-sections.helper.ts`) anexa links/componentes |
| `Switch` | liga/desliga acessível (`role=switch`, rótulo + descrição): consentimentos, preferências |
| `useHashScroll(ready)` | rola até o `#hash` da URL depois que o conteúdo da query renderizou (o salto nativo do navegador já passou); devolve o hash |
| `TierPortrait` | retrato 4:5 com moldura do metal do tier e crédito da foto (ano · autor · licença); vai no `media` do `PageLayout`/`PageHeader` (novo prop: visual à esquerda do título) |
| `MeterList` | linhas rótulo · barra · valor (`items [{ key, label, percent, valueText, fill?, emphasis? }]`): distribuição de votos e afins |
| `RangeBars` | gantt num eixo de anos (`items [{ key, label, from, to, text, description?, tone }]`): equipes, reinados |
| `FactList` + `FactListSeparator` | `<dl>` de fatos, `variant="stacked"` (ficha) ou `"split"` (rótulo à esquerda, valor à direita) |
| `useUrlSearchText(urlValue, commit)` | caixa de busca ligada a `?q=` com debounce (mantém espaços enquanto digita; "Limpar filtros" volta para a caixa) |
| `ConfirmDialog` | modal de confirmação com motivo obrigatório opcional (`reason={{ minLength }}`), campos extras como `children`, pendente e erro inline (o `Error` lançado em `onConfirm` aparece no diálogo) |
| `DecisionBar` | botões de decisão (aprovar · rejeitar · ocultar…) que confirmam num `ConfirmDialog`: `actions [{ key, label, variant, confirmTitle, confirmBody?, reason?, disabled?, onConfirm(reason) }]` |
| `ReviewQueue` | fila mestre–detalhe: `items getKey selectedKey onSelect renderItem renderDetail emptyTitle` (seleção em `?item=`; no celular empilha e leva o foco ao detalhe) |
| `StatusFilter` | chips de status com contadores + "Todos" (`options [{ value, label, count }]`, `value` em `?status=`) |
| `DiffView` | diff de 3 vias base · atual · proposto, destaca o que difere da base e avisa conflito de versão; `proposedNote` (ex.: trecho de evidência) |
Helpers: `format.helper.ts` (formatDate, formatDayMonth, formatDateRange, formatYears, formatNumber, ageAt, initials, tokenColor), `domain-labels.const.ts` (rótulos de tier, nível, medalha, tópico, status de fonte, papéis de org), `ui-text.const.ts`, `cx`, `useDisclosure`, `useDismiss`, `useTheme`/`useEffectiveTheme`, `downloadJson(filename, data)` (`download.helper.ts`), `donutOption`/`barsOption` (`chart-presets.helper.ts`, cores por token), `formatRelativeDay` (`relative-time.helper.ts`: hoje/ontem/há n dias).
Shared (BE+FE): `matchesAthleteFilters`, `isCompetitionWin`/`competitionWins`/`winYearSpan`/`careerOverlapYears` + `WINNING_ACHIEVEMENT_TYPES`, `Football|Swimming|Boxing|CsStatsSchema` (stats por esporte), `normalizeForSearch`, `validateComment`, `validateSuggestion`, `validateContact`, `checkSourceUrl`, `eventsOnDay/eventsBetween/eventKey`, `addDaysIso`, `addDaysMonthDay`/`monthDayToIso`/`nextMonthDayOccurrence`, `featuredAssociations`/`filterSportsTree`/`countSports`/`filterOrgTree`/`countOrgTree`/`matchesSportSearch`/`matchesCompetitionFilters`, `createCommentInputSchema`, `createSuggestionInputSchema`, `createContactInputSchema`.

## Sessão e participação
Login real = Google via Better Auth (cookie `was.session_token`, mesmo domínio). `useSession()` lê `kind`/`user` do `sessionQuery` (já vem no SSR). `pendingConsent` abre o `ConsentDialog` bloqueante (Termos + Privacidade com versões, 18+; "Não aceito, sair"). `signOut()` encerra o Better Auth, zera o perfil simulado e recarrega as queries. O seletor de perfis simulados (e o header `x-was-session`) só existe em fixtures ou com `AUTH_SIMULATED` no servidor (`session.simulated`).
`const { isSignedIn, isAdmin, user, requireLogin } = useSession();` → antes de votar/comentar/responder/curtir: `if (!requireLogin('vote')) return;` (abre o popup). `tierVotesQuery` exige conta (use `enabled: isSignedIn`; visitante vê só o tier oficial e os 4 botões). As mutações na demo vão para `demoStore` (memória + localStorage; o SSR não as vê, e o cliente invalida as queries depois da hidratação se houver algo salvo); "Limpar … da demo" no menu de sessão zera.

## Regras
- **Nunca** redefina algo do catálogo. Precisa de variação genérica? Estenda o componente em `shared-ui` (com props), não copie.
- Genérico (usado por 2+ módulos) → `shared-ui`. Específico → `modules/<módulo>`. Enums/consts/schemas/regras de negócio → **só** `packages/shared`.
- Um arquivo, uma responsabilidade, com sufixo (`.page.tsx`, `.component.tsx`, `.hook.ts`, `.helper.ts`, `.const.ts`, `.schema.ts`, `.query.ts`, `.fixture.ts`…). Imports diretos (sem barrel no app).
- Textos de UI só em `<módulo>.const.ts` (ou `ui-text.const.ts`/`domain-labels.const.ts`) com `.en.ts`/`.es.ts` ao lado, lidos por `useText`. Nada de string visível solta no JSX.
- Cores só por tokens (`var(--…)`, `tokenColor('c-teal')`). **Nenhum hex** em componentes/CSS de módulo; tokens novos vão para `packages/shared/src/theme/theme.css` (claro e escuro).
- Filtros e abas na URL (`useUrlFilters`), nunca em estado solto.
- A11y (WCAG 2.2 AA, doc 14): um `h1` por página (PageLayout); ícones decorativos `aria-hidden`; botões sem texto com `aria-label`; foco visível; erros de formulário via `FormField` (aria-describedby) e foco no primeiro inválido; 375 px sem rolagem horizontal; respeite `prefers-reduced-motion`.
- Imagens só por link, `referrerPolicy="no-referrer"`, `loading="lazy"`.
- Verifique: `pnpm test`, `pnpm typecheck`, `pnpm --filter web build`, light/dark, `?fixture=empty|loading|error`, console sem erro de hidratação.
