import { createRootRouteWithContext, createRoute, lazyRouteComponent, notFound, redirect } from '@tanstack/react-router';
import {
  AdminCommentsSearchSchema,
  AdminContactSearchSchema,
  AdminIngestionSearchSchema,
  AdminQueueSearchSchema,
  AdminReviewSearchSchema,
  type AdminSection,
  AdminSourcesSearchSchema,
  AdminUsersSearchSchema,
  AthleteListQuerySchema,
  AthleteProfileSearchSchema,
  AthleteProfileTab,
  athleteJsonLd,
  breadcrumbJsonLd,
  ContactSearchSchema,
  HomeSearchSchema,
  itemListJsonLd,
  MonthDaySchema,
  monthDayToIso,
  NotificationsSearchSchema,
  organizationJsonLd,
  SourcesFiltersSchema,
  SportPageFiltersSchema,
  SportsFiltersSchema,
  sportJsonLd,
  webSiteJsonLd,
} from '@was/shared';
import type { ComponentType } from 'react';

import { sessionQuery } from '@/data/endpoints/session.query';
import { currentText } from '@/i18n/text-for.helper';
import { currentLocalized } from '@/i18n/use-localized.hook';
import { NotFoundPage } from '@/modules/errors/not-found.page';
import { identityStore } from '@/session/session.store';
import { sessionIdentity } from '@/session/session-identity.helper';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';

import { buildHead, rootHead } from './head.helper';
import type { PageMeta } from './page-meta.interface';
import { getBoot } from './request-scope';
import { IS_SERVER } from './request-scope.const';
import { RootDocument } from './root-document.component';
import { RootLayout } from './root-layout.component';
import { ensureOr404, prefetchQueries } from './route-prefetch.helper';
import type { RouterContext } from './router-context.interface';

// One chunk per page module (loaded on navigation / hover preload). The module path also goes to the route's
// staticData, so the server can <link rel="modulepreload"> the page chunk of the matched route (no waterfall).
const PAGE_MODULES = import.meta.glob<Record<string, ComponentType>>(['/src/modules/**/*.page.tsx', '!/src/modules/errors/**']); // errors/: static (root)
const lazyPage = (file: string, exportName: string) => {
  const key = `/src/modules/${file}.page.tsx`;
  const load = PAGE_MODULES[key];
  if (!load) throw new Error(`Page module ${key} not found`);
  return { component: lazyRouteComponent(load, exportName), staticData: { pageModule: key.slice(1) } };
};
type LazyPage = ReturnType<typeof lazyPage>;
const CriteriaPage = lazyPage('about/criteria', 'CriteriaPage');
const MePage = lazyPage('account/me', 'MePage');
const MyDataPage = lazyPage('account/my-data', 'MyDataPage');
const NotificationsPage = lazyPage('account/notifications', 'NotificationsPage');
const AdminHomePage = lazyPage('admin/admin-home', 'AdminHomePage');
const AdminReviewPage = lazyPage('admin/admin-review', 'AdminReviewPage');
const AdminIngestionPage = lazyPage('admin/admin-ingestion', 'AdminIngestionPage');
const AdminSourcesPage = lazyPage('admin/admin-sources', 'AdminSourcesPage');
const AdminUsersPage = lazyPage('admin/admin-users', 'AdminUsersPage');
const AdminPrivacyPage = lazyPage('admin/admin-privacy', 'AdminPrivacyPage');
const AdminDossiersPage = lazyPage('admin/admin-dossiers', 'AdminDossiersPage');
const AdminCommentsPage = lazyPage('admin/admin-comments', 'AdminCommentsPage');
const AdminContactPage = lazyPage('admin/admin-contact', 'AdminContactPage');
const AdminMergePage = lazyPage('admin/admin-merge', 'AdminMergePage');
const AthleteProfilePage = lazyPage('athletes/athlete-profile', 'AthleteProfilePage');
const AthletesPage = lazyPage('athletes/athletes', 'AthletesPage');
const ContactPage = lazyPage('contact/contact', 'ContactPage');
const HallOfGreatsPage = lazyPage('hall-of-greats/hall-of-greats', 'HallOfGreatsPage');
const HomePage = lazyPage('home/home', 'HomePage');
const AccessibilityPage = lazyPage('legal/accessibility', 'AccessibilityPage');
const CookiesPage = lazyPage('legal/cookies', 'CookiesPage');
const PrivacyPage = lazyPage('legal/privacy', 'PrivacyPage');
const TermsPage = lazyPage('legal/terms', 'TermsPage');
const OnThisDayPage = lazyPage('on-this-day/on-this-day', 'OnThisDayPage');
const RankingPage = lazyPage('rankings/ranking', 'RankingPage');
const RankingsPage = lazyPage('rankings/rankings', 'RankingsPage');
const SourcesPage = lazyPage('sources/sources', 'SourcesPage');
const SportPage = lazyPage('sports/sport', 'SportPage');
const SportsPage = lazyPage('sports/sports', 'SportsPage');

// Every screen of doc 09 has a typed route. Search params are validated by the shared filter schemas, so links
// (`<Link to="/athletes" search={{ sport: 'football' }}>`) and pages (`useUrlFilters(schema)`) agree on the URL.
//
// SSR (app/entry-server.tsx): loaders only PREFETCH (prefetchQueries / ensureOr404) with the same query inputs the
// pages use (`*-query.helper.ts`), and return the PageMeta of the route <head>. Texts are imported lazily, in the
// page's own chunk.

declare module '@tanstack/react-router' {
  interface StaticDataRouteOption {
    /** Source of the page chunk (`src/modules/…page.tsx`, a key of the Vite manifest). */
    pageModule?: string;
  }
}

/** PUBLIC_URL of this page load (absolute URLs in structured data). */
const origin = () => getBoot().publicUrl;
/** Breadcrumb root of the structured data, in the current language. */
const homeCrumb = () => ({ name: currentText(UI_MESSAGES).home, path: '/' });
/** ItemList is capped: it describes the page's first screenful, not the whole catalog (the sitemap does that). */
const LIST_LD_MAX = 50;

/** Route head from the PageMeta returned by its loader (title, description, canonical, og, JSON-LD). */
const head = ({ loaderData, match }: { loaderData?: PageMeta | undefined; match: { pathname: string } }) => buildHead(loaderData, match.pathname);
/** Meta of a static page whose texts live in a const module (loaded with the page chunk). */
const staticMeta = (load: () => Promise<PageMeta>) => ({ loader: load, head });

const rootRoute = createRootRouteWithContext<RouterContext>()({
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  head: rootHead,
  // Server: the session first (beforeLoad runs before every page loader): the header shows it in the first paint and
  // its identity goes into the keys of the personalized queries the page loaders prefetch. The browser keeps the
  // identity in sync from the session query (SessionProvider).
  beforeLoad: async ({ context }) => {
    if (!IS_SERVER) return;
    const session = sessionQuery.queryOptions();
    await prefetchQueries(context.queryClient, [session]);
    identityStore.set(sessionIdentity(context.queryClient.getQueryData(session.queryKey)));
  },
});
const page = <P extends string>(path: P, component: LazyPage, load: () => Promise<PageMeta>) =>
  createRoute({ getParentRoute: () => rootRoute, path, ...component, ...staticMeta(load) });
/** Account and admin pages: data depends on the session, nothing to prefetch; never indexed. */
const privatePage = <P extends string>(path: P, component: LazyPage, title: () => Promise<string>) =>
  page(path, component, async () => ({ title: await title(), noindex: true }));
const accountTitle = (key: 'me' | 'notifications' | 'data') => async () =>
  currentText((await import('@/modules/account/account.const')).ACCOUNT_MESSAGES)[key].title;
const adminTitle = (section?: AdminSection) => async () => {
  const t = currentText((await import('@/modules/admin/admin.const')).ADMIN_MESSAGES);
  return section ? t.sections[section].title : t.title;
};

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: HomeSearchSchema,
  loaderDeps: ({ search }) => ({ date: search.date }),
  loader: async ({ context, deps }) => {
    const [{ homeQuery }, { homeQueryInput }, { HOME_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/home.query'),
      import('@/modules/home/home-query.helper'),
      import('@/modules/home/home.const'),
    ]);
    await prefetchQueries(context.queryClient, [homeQuery.queryOptions(homeQueryInput(deps, getBoot().today))]);
    const t = currentText(HOME_MESSAGES);
    return {
      title: t.documentTitle,
      description: t.intro.subtitle,
      fullTitle: true,
      jsonLd: [webSiteJsonLd(origin()), organizationJsonLd(origin())],
    } satisfies PageMeta;
  },
  head,
  ...HomePage,
});
const hallRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/hall-of-greats',
  loader: async ({ context }) => {
    const [{ hallOfGreatsQuery }, { HALL_OF_GREATS_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/discovery.query'),
      import('@/modules/hall-of-greats/hall-of-greats.const'),
    ]);
    const options = hallOfGreatsQuery.queryOptions();
    await prefetchQueries(context.queryClient, [options]);
    const greats = context.queryClient.getQueryData(options.queryKey)?.greats ?? [];
    const t = currentText(HALL_OF_GREATS_MESSAGES).page;
    return {
      title: t.title,
      description: t.lead,
      jsonLd: [
        itemListJsonLd(
          origin(),
          t.title,
          greats.map((g) => ({ name: g.knownAs, path: `/athletes/${g.slug}` })),
        ),
      ],
    } satisfies PageMeta;
  },
  head,
  ...HallOfGreatsPage,
});
const athletesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/athletes',
  validateSearch: AthleteListQuerySchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const [{ athletesQuery }, { ALL_ATHLETES_INPUT, athletesListInput }, { ATHLETES_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/athletes.query'),
      import('@/modules/athletes/athletes-query.helper'),
      import('@/modules/athletes/athletes.const'),
    ]);
    const list = athletesQuery.queryOptions(athletesListInput(deps));
    await prefetchQueries(context.queryClient, [athletesQuery.queryOptions(ALL_ATHLETES_INPUT), list]);
    const items = context.queryClient.getQueryData(list.queryKey)?.items ?? [];
    const t = currentText(ATHLETES_MESSAGES).list;
    return {
      title: t.title,
      description: t.lead,
      jsonLd: [
        itemListJsonLd(
          origin(),
          t.title,
          items.slice(0, LIST_LD_MAX).map((a) => ({ name: a.knownAs, path: `/athletes/${a.slug}` })),
        ),
      ],
    } satisfies PageMeta;
  },
  head,
  ...AthletesPage,
});
const athleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/athletes/$slug',
  validateSearch: AthleteProfileSearchSchema,
  loaderDeps: ({ search }) => ({ sort: search.sort, tab: search.tab }),
  loader: async ({ context, deps, params }) => {
    const [{ athleteProfileQuery, athletesQuery, analysisDimensionsQuery }, { commentsQuery }, { tierVotesQuery }, input, { ATHLETE_PROFILE_MESSAGES }] =
      await Promise.all([
        import('@/data/endpoints/athletes.query'),
        import('@/data/endpoints/comments.query'),
        import('@/data/endpoints/tier-votes.query'),
        import('@/modules/athletes/athletes-query.helper'),
        import('@/modules/athletes/athletes.const'),
      ]);
    const extra: { queryKey: readonly unknown[] }[] = [commentsQuery.queryOptions(input.commentsInput(params.slug, deps.sort))];
    // Signed in: the vote card's shares come with the page instead of a second round-trip after it renders.
    if (context.queryClient.getQueryData(sessionQuery.queryOptions().queryKey)?.user)
      extra.push(tierVotesQuery.queryOptions({ params: { slug: params.slug } }));
    if (deps.tab === AthleteProfileTab.Analysis) extra.push(athletesQuery.queryOptions(input.ALL_ATHLETES_INPUT), analysisDimensionsQuery.queryOptions());
    const [athlete] = await Promise.all([
      ensureOr404(context.queryClient, athleteProfileQuery.queryOptions(input.athleteProfileInput(params.slug))),
      prefetchQueries(context.queryClient, extra),
    ]);
    const t = currentText(ATHLETE_PROFILE_MESSAGES);
    if (!athlete) return { title: t.eyebrow } satisfies PageMeta;
    return {
      title: athlete.knownAs,
      description: t.metaDescription(athlete.knownAs, athlete.sport.name),
      image: athlete.photo?.url,
      jsonLd: [
        athleteJsonLd(origin(), athlete),
        breadcrumbJsonLd(origin(), [
          homeCrumb(),
          { name: athlete.sport.name, path: `/sports/${athlete.sport.slug}` },
          { name: t.breadcrumb, path: '/athletes' },
          { name: athlete.knownAs },
        ]),
      ],
    } satisfies PageMeta;
  },
  head,
  ...AthleteProfilePage,
});
const sportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sports',
  validateSearch: SportsFiltersSchema,
  loader: async ({ context }) => {
    const [{ sportsQuery, governanceModelsQuery, organizationsQuery }, { SPORTS_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/sports.query'),
      import('@/modules/sports/sports.const'),
    ]);
    const tree = sportsQuery.queryOptions();
    await prefetchQueries(context.queryClient, [tree, governanceModelsQuery.queryOptions(), organizationsQuery.queryOptions()]);
    const sports = (context.queryClient.getQueryData(tree.queryKey) ?? []).flatMap((g) => g.subgroups.flatMap((sg) => sg.sports));
    const t = currentText(SPORTS_MESSAGES).list;
    return {
      title: t.title,
      description: t.lead,
      jsonLd: [
        itemListJsonLd(
          origin(),
          t.title,
          sports.map((sp) => ({ name: sp.name, path: `/sports/${sp.slug}` })),
        ),
      ],
    } satisfies PageMeta;
  },
  head,
  ...SportsPage,
});
const sportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sports/$slug',
  validateSearch: SportPageFiltersSchema,
  loader: async ({ context, params }) => {
    const [{ sportPageQuery }, { sportPageInput }, { SPORTS_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/sports.query'),
      import('@/modules/sports/sports-query.helper'),
      import('@/modules/sports/sports.const'),
    ]);
    const sport = await ensureOr404(context.queryClient, sportPageQuery.queryOptions(sportPageInput(params.slug)));
    const t = currentText(SPORTS_MESSAGES).page;
    if (!sport) return { title: t.title } satisfies PageMeta;
    return {
      title: sport.name,
      description: t.metaDescription(sport.name),
      jsonLd: [sportJsonLd(origin(), sport), breadcrumbJsonLd(origin(), [homeCrumb(), { name: t.sports, path: '/sports' }, { name: sport.name }])],
    } satisfies PageMeta;
  },
  head,
  ...SportPage,
});
/** P22 was merged into /sports (04/11/2026): the old route redirects to the hierarchy section. */
const organizationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/organizations',
  beforeLoad: () => {
    throw redirect({ to: '/sports', hash: 'hierarquia', replace: true });
  },
});
/** P12: the calendar lives on the home (#calendario), no page of its own. */
const calendarRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  beforeLoad: () => {
    throw redirect({ to: '/', hash: 'calendario', replace: true });
  },
});
const rankingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rankings',
  loader: async ({ context }) => {
    const [{ rankingsQuery }, { RANKINGS_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/rankings.query'),
      import('@/modules/rankings/rankings.const'),
    ]);
    await prefetchQueries(context.queryClient, [rankingsQuery.queryOptions()]);
    const t = currentText(RANKINGS_MESSAGES).list;
    return { title: t.title, description: t.lead } satisfies PageMeta;
  },
  head,
  ...RankingsPage,
});
const rankingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rankings/$id',
  loader: async ({ context, params }) => {
    const [{ rankingDetailQuery }, { RANKINGS_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/rankings.query'),
      import('@/modules/rankings/rankings.const'),
    ]);
    await prefetchQueries(context.queryClient, [rankingDetailQuery.queryOptions({ params: { id: params.id }, query: { page: 1, pageSize: 50 } })]);
    return { title: currentText(RANKINGS_MESSAGES).list.title } satisfies PageMeta;
  },
  head,
  ...RankingPage,
});
const sourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sources',
  validateSearch: SourcesFiltersSchema,
  loader: async ({ context }) => {
    const [{ sourcesQuery, collectionRunsQuery }, { SOURCES_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/discovery.query'),
      import('@/modules/sources/sources.const'),
    ]);
    await prefetchQueries(context.queryClient, [sourcesQuery.queryOptions(), collectionRunsQuery.queryOptions()]);
    const t = currentText(SOURCES_MESSAGES).page;
    return { title: t.title, description: t.lead } satisfies PageMeta;
  },
  head,
  ...SourcesPage,
});
const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  validateSearch: ContactSearchSchema,
  loader: async ({ context }) => {
    const [{ validationContextQuery }, { CONTACT_MESSAGES }] = await Promise.all([
      import('@/data/endpoints/discovery.query'),
      import('@/modules/contact/contact.const'),
    ]);
    await prefetchQueries(context.queryClient, [validationContextQuery.queryOptions()]);
    const t = currentText(CONTACT_MESSAGES).page;
    return { title: t.title, description: t.lead } satisfies PageMeta;
  },
  head,
  ...ContactPage,
});
const onThisDayRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/on-this-day/$md',
  params: {
    parse: ({ md }) => {
      const parsed = MonthDaySchema.safeParse(md);
      if (!parsed.success) throw notFound();
      return { md: parsed.data };
    },
    stringify: ({ md }) => ({ md }),
  },
  loader: async ({ context, params }) => {
    const [{ onThisDayQuery }, { ON_THIS_DAY_MESSAGES }, { formatDayMonth }] = await Promise.all([
      import('@/data/endpoints/discovery.query'),
      import('@/modules/on-this-day/on-this-day.const'),
      import('@/shared-ui/format.helper'),
    ]);
    await prefetchQueries(context.queryClient, [onThisDayQuery.queryOptions({ params: { md: params.md } })]);
    const label = formatDayMonth(monthDayToIso(params.md));
    const t = currentText(ON_THIS_DAY_MESSAGES);
    return {
      title: t.title(label),
      description: t.lead,
      jsonLd: [breadcrumbJsonLd(origin(), [homeCrumb(), { name: t.eyebrow }, { name: label }])],
    } satisfies PageMeta;
  },
  head,
  ...OnThisDayPage,
});
const meRoute = privatePage('/me', MePage, accountTitle('me'));
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/me/notifications',
  validateSearch: NotificationsSearchSchema,
  ...NotificationsPage,
  ...staticMeta(async () => ({ title: await accountTitle('notifications')(), noindex: true })),
});
const myDataRoute = privatePage('/me/data', MyDataPage, accountTitle('data'));
const legalDoc = (key: 'privacy' | 'terms' | 'cookies' | 'accessibility') => async (): Promise<PageMeta> => {
  const doc = currentLocalized((await import('@/modules/legal/legal.const')).LEGAL_DOCS)[key];
  return { title: doc.title, description: doc.lead };
};
const privacyRoute = page('/legal/privacy', PrivacyPage, legalDoc('privacy'));
const termsRoute = page('/legal/terms', TermsPage, legalDoc('terms'));
const cookiesRoute = page('/legal/cookies', CookiesPage, legalDoc('cookies'));
const accessibilityRoute = page('/accessibility', AccessibilityPage, legalDoc('accessibility'));
const criteriaRoute = page('/about/criteria', CriteriaPage, async () => {
  const doc = currentLocalized((await import('@/modules/about/about.const')).CRITERIA_DOCS);
  return { title: doc.title, description: doc.lead };
});
const adminRoute = privatePage('/admin', AdminHomePage, adminTitle());
/** A1–A8: one typed route per admin section (search params from @was/shared admin schemas). */
const adminPage = <P extends string, S extends typeof AdminQueueSearchSchema>(path: P, validateSearch: S, component: LazyPage, section: AdminSection) =>
  createRoute({
    getParentRoute: () => rootRoute,
    path,
    validateSearch,
    ...component,
    ...staticMeta(async () => ({ title: await adminTitle(section)(), noindex: true })),
  });
const adminReviewRoute = adminPage('/admin/review', AdminReviewSearchSchema, AdminReviewPage, 'review');
const adminIngestionRoute = adminPage('/admin/ingestion', AdminIngestionSearchSchema, AdminIngestionPage, 'ingestion');
const adminSourcesRoute = adminPage('/admin/sources', AdminSourcesSearchSchema, AdminSourcesPage, 'sources');
const adminUsersRoute = adminPage('/admin/users', AdminUsersSearchSchema, AdminUsersPage, 'users');
const adminPrivacyRoute = adminPage('/admin/privacy', AdminQueueSearchSchema, AdminPrivacyPage, 'privacy');
const adminDossiersRoute = adminPage('/admin/dossiers', AdminQueueSearchSchema, AdminDossiersPage, 'dossiers');
const adminCommentsRoute = adminPage('/admin/comments', AdminCommentsSearchSchema, AdminCommentsPage, 'comments');
const adminContactRoute = adminPage('/admin/contact', AdminContactSearchSchema, AdminContactPage, 'contact');
/** D14: merge/unmerge of competitors (not an A1–A8 queue: own title catalog). */
const adminMergeRoute = privatePage('/admin/merge', AdminMergePage, async () => currentText((await import('@/modules/admin/admin-merge.const')).ADMIN_MERGE_MESSAGES).title);

export const routeTree = rootRoute.addChildren([
  homeRoute,
  hallRoute,
  athletesRoute,
  athleteRoute,
  sportsRoute,
  sportRoute,
  organizationsRoute,
  calendarRoute,
  rankingsRoute,
  rankingRoute,
  sourcesRoute,
  contactRoute,
  onThisDayRoute,
  meRoute,
  notificationsRoute,
  myDataRoute,
  privacyRoute,
  termsRoute,
  cookiesRoute,
  accessibilityRoute,
  criteriaRoute,
  adminRoute,
  adminReviewRoute,
  adminIngestionRoute,
  adminSourcesRoute,
  adminUsersRoute,
  adminPrivacyRoute,
  adminDossiersRoute,
  adminCommentsRoute,
  adminContactRoute,
  adminMergeRoute,
]);
