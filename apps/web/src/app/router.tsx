import {
  type AdminSection,
  AdminCommentsSearchSchema,
  AdminContactSearchSchema,
  AdminIngestionSearchSchema,
  AdminQueueSearchSchema,
  AdminReviewSearchSchema,
  AdminSourcesSearchSchema,
  AdminUsersSearchSchema,
  AthleteFiltersSchema,
  AthleteProfileSearchSchema,
  AthleteProfileTab,
  ContactSearchSchema,
  HomeSearchSchema,
  MonthDaySchema,
  monthDayToIso,
  NotificationsSearchSchema,
  SourcesFiltersSchema,
  SportPageFiltersSchema,
  SportsFiltersSchema,
} from '@was/shared';
import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, createRoute, lazyRouteComponent, notFound, redirect } from '@tanstack/react-router';

import { sessionQuery } from '@/data/endpoints/session.query';
import { NotFoundPage } from '@/modules/errors/not-found.page';

import { buildHead, type PageMeta, rootHead } from './head.helper';
import { getBoot } from './request-scope';
import { RootDocument } from './root-document.component';
import { RootLayout } from './root-layout.component';
import { ensureOr404, prefetchQueries } from './route-prefetch.helper';

// One chunk per page module (loaded on navigation / hover preload).
const CriteriaPage = lazyRouteComponent(() => import('@/modules/about/criteria.page'), 'CriteriaPage');
const MePage = lazyRouteComponent(() => import('@/modules/account/me.page'), 'MePage');
const MyDataPage = lazyRouteComponent(() => import('@/modules/account/my-data.page'), 'MyDataPage');
const NotificationsPage = lazyRouteComponent(() => import('@/modules/account/notifications.page'), 'NotificationsPage');
const AdminHomePage = lazyRouteComponent(() => import('@/modules/admin/admin-home.page'), 'AdminHomePage');
const AdminReviewPage = lazyRouteComponent(() => import('@/modules/admin/admin-review.page'), 'AdminReviewPage');
const AdminIngestionPage = lazyRouteComponent(() => import('@/modules/admin/admin-ingestion.page'), 'AdminIngestionPage');
const AdminSourcesPage = lazyRouteComponent(() => import('@/modules/admin/admin-sources.page'), 'AdminSourcesPage');
const AdminUsersPage = lazyRouteComponent(() => import('@/modules/admin/admin-users.page'), 'AdminUsersPage');
const AdminPrivacyPage = lazyRouteComponent(() => import('@/modules/admin/admin-privacy.page'), 'AdminPrivacyPage');
const AdminDossiersPage = lazyRouteComponent(() => import('@/modules/admin/admin-dossiers.page'), 'AdminDossiersPage');
const AdminCommentsPage = lazyRouteComponent(() => import('@/modules/admin/admin-comments.page'), 'AdminCommentsPage');
const AdminContactPage = lazyRouteComponent(() => import('@/modules/admin/admin-contact.page'), 'AdminContactPage');
const AthleteProfilePage = lazyRouteComponent(() => import('@/modules/athletes/athlete-profile.page'), 'AthleteProfilePage');
const AthletesPage = lazyRouteComponent(() => import('@/modules/athletes/athletes.page'), 'AthletesPage');
const ContactPage = lazyRouteComponent(() => import('@/modules/contact/contact.page'), 'ContactPage');
const HallOfGreatsPage = lazyRouteComponent(() => import('@/modules/hall-of-greats/hall-of-greats.page'), 'HallOfGreatsPage');
const HomePage = lazyRouteComponent(() => import('@/modules/home/home.page'), 'HomePage');
const AccessibilityPage = lazyRouteComponent(() => import('@/modules/legal/accessibility.page'), 'AccessibilityPage');
const CookiesPage = lazyRouteComponent(() => import('@/modules/legal/cookies.page'), 'CookiesPage');
const PrivacyPage = lazyRouteComponent(() => import('@/modules/legal/privacy.page'), 'PrivacyPage');
const TermsPage = lazyRouteComponent(() => import('@/modules/legal/terms.page'), 'TermsPage');
const OnThisDayPage = lazyRouteComponent(() => import('@/modules/on-this-day/on-this-day.page'), 'OnThisDayPage');
const SourcesPage = lazyRouteComponent(() => import('@/modules/sources/sources.page'), 'SourcesPage');
const SportPage = lazyRouteComponent(() => import('@/modules/sports/sport.page'), 'SportPage');
const SportsPage = lazyRouteComponent(() => import('@/modules/sports/sports.page'), 'SportsPage');

// Every screen of doc 09 has a typed route. Search params are validated by the shared filter schemas, so links
// (`<Link to="/athletes" search={{ sport: 'futebol' }}>`) and pages (`useUrlFilters(schema)`) agree on the URL.
//
// SSR (app/entry-server.tsx): loaders only PREFETCH (prefetchQueries / ensureOr404) with the same query inputs the
// pages use (`*-query.helper.ts`), and return the PageMeta of the route <head>. Texts are imported lazily, in the
// page's own chunk.

export interface RouterContext {
  queryClient: QueryClient;
}

/** Route head from the PageMeta returned by its loader (title, description, canonical, og). */
const head = ({ loaderData, match }: { loaderData?: PageMeta | undefined; match: { pathname: string } }) => buildHead(loaderData, match.pathname);
/** Meta of a static page whose texts live in a const module (loaded with the page chunk). */
const staticMeta = (load: () => Promise<PageMeta>) => ({ loader: load, head });

const rootRoute = createRootRouteWithContext<RouterContext>()({
  shellComponent: RootDocument,
  component: RootLayout,
  notFoundComponent: NotFoundPage,
  head: rootHead,
  // The header shows the session (name, admin links) in the first paint.
  loader: ({ context }) => prefetchQueries(context.queryClient, [sessionQuery.queryOptions()]),
});
const page = <P extends string>(path: P, component: ReturnType<typeof lazyRouteComponent>, load: () => Promise<PageMeta>) =>
  createRoute({ getParentRoute: () => rootRoute, path, component, ...staticMeta(load) });
/** Account and admin pages: data depends on the session, nothing to prefetch; never indexed. */
const privatePage = <P extends string>(path: P, component: ReturnType<typeof lazyRouteComponent>, title: () => Promise<string>) =>
  page(path, component, async () => ({ title: await title(), noindex: true }));
const accountTitle = (key: 'me' | 'notifications' | 'data') => async () => (await import('@/modules/account/account.const')).ACCOUNT_TEXT[key].title;
const adminTitle = (section?: AdminSection) => async () => {
  const { ADMIN_TEXT } = await import('@/modules/admin/admin.const');
  return section ? ADMIN_TEXT.sections[section].title : ADMIN_TEXT.title;
};

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: HomeSearchSchema,
  loaderDeps: ({ search }) => ({ date: search.date }),
  loader: async ({ context, deps }) => {
    const [{ homeQuery }, { homeQueryInput }, { HOME_TEXT }] = await Promise.all([
      import('@/data/endpoints/home.query'),
      import('@/modules/home/home-query.helper'),
      import('@/modules/home/home.const'),
    ]);
    await prefetchQueries(context.queryClient, [homeQuery.queryOptions(homeQueryInput(deps, getBoot().today))]);
    return { title: HOME_TEXT.documentTitle, description: HOME_TEXT.intro.subtitle, fullTitle: true } satisfies PageMeta;
  },
  head,
  component: HomePage,
});
const hallRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/hall-of-greats',
  loader: async ({ context }) => {
    const [{ hallOfGreatsQuery }, { HALL_OF_GREATS_TEXT }] = await Promise.all([import('@/data/endpoints/discovery.query'), import('@/modules/hall-of-greats/hall-of-greats.const')]);
    await prefetchQueries(context.queryClient, [hallOfGreatsQuery.queryOptions()]);
    return { title: HALL_OF_GREATS_TEXT.page.title, description: HALL_OF_GREATS_TEXT.page.lead } satisfies PageMeta;
  },
  head,
  component: HallOfGreatsPage,
});
const athletesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/athletes',
  validateSearch: AthleteFiltersSchema,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const [{ athletesQuery }, { ALL_ATHLETES_INPUT, athletesListInput }, { ATHLETES_TEXT }] = await Promise.all([
      import('@/data/endpoints/athletes.query'),
      import('@/modules/athletes/athletes-query.helper'),
      import('@/modules/athletes/athletes.const'),
    ]);
    await prefetchQueries(context.queryClient, [athletesQuery.queryOptions(ALL_ATHLETES_INPUT), athletesQuery.queryOptions(athletesListInput(deps))]);
    return { title: ATHLETES_TEXT.list.title, description: ATHLETES_TEXT.list.lead } satisfies PageMeta;
  },
  head,
  component: AthletesPage,
});
const athleteRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/athletes/$slug',
  validateSearch: AthleteProfileSearchSchema,
  loaderDeps: ({ search }) => ({ sort: search.sort, tab: search.tab }),
  loader: async ({ context, deps, params }) => {
    const [{ athleteProfileQuery, athletesQuery, analysisDimensionsQuery }, { commentsQuery }, input, { ATHLETE_PROFILE_TEXT }] = await Promise.all([
      import('@/data/endpoints/athletes.query'),
      import('@/data/endpoints/comments.query'),
      import('@/modules/athletes/athletes-query.helper'),
      import('@/modules/athletes/athletes.const'),
    ]);
    const extra: { queryKey: readonly unknown[] }[] = [commentsQuery.queryOptions(input.commentsInput(params.slug, deps.sort))];
    if (deps.tab === AthleteProfileTab.Analysis) extra.push(athletesQuery.queryOptions(input.ALL_ATHLETES_INPUT), analysisDimensionsQuery.queryOptions());
    const [athlete] = await Promise.all([
      ensureOr404(context.queryClient, athleteProfileQuery.queryOptions(input.athleteProfileInput(params.slug))),
      prefetchQueries(context.queryClient, extra),
    ]);
    if (!athlete) return { title: ATHLETE_PROFILE_TEXT.eyebrow } satisfies PageMeta;
    return { title: athlete.knownAs, description: ATHLETE_PROFILE_TEXT.metaDescription(athlete.knownAs, athlete.sport.name) } satisfies PageMeta;
  },
  head,
  component: AthleteProfilePage,
});
const sportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sports',
  validateSearch: SportsFiltersSchema,
  loader: async ({ context }) => {
    const [{ sportsQuery, governanceModelsQuery, organizationsQuery }, { SPORTS_TEXT }] = await Promise.all([import('@/data/endpoints/sports.query'), import('@/modules/sports/sports.const')]);
    await prefetchQueries(context.queryClient, [sportsQuery.queryOptions(), governanceModelsQuery.queryOptions(), organizationsQuery.queryOptions()]);
    return { title: SPORTS_TEXT.list.title, description: SPORTS_TEXT.list.lead } satisfies PageMeta;
  },
  head,
  component: SportsPage,
});
const sportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sports/$slug',
  validateSearch: SportPageFiltersSchema,
  loader: async ({ context, params }) => {
    const [{ sportPageQuery }, { sportPageInput }, { SPORTS_TEXT }] = await Promise.all([
      import('@/data/endpoints/sports.query'),
      import('@/modules/sports/sports-query.helper'),
      import('@/modules/sports/sports.const'),
    ]);
    const sport = await ensureOr404(context.queryClient, sportPageQuery.queryOptions(sportPageInput(params.slug)));
    if (!sport) return { title: SPORTS_TEXT.page.title } satisfies PageMeta;
    return { title: sport.name, description: SPORTS_TEXT.page.metaDescription(sport.name) } satisfies PageMeta;
  },
  head,
  component: SportPage,
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
const sourcesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/sources',
  validateSearch: SourcesFiltersSchema,
  loader: async ({ context }) => {
    const [{ sourcesQuery, collectionRunsQuery }, { SOURCES_TEXT }] = await Promise.all([import('@/data/endpoints/discovery.query'), import('@/modules/sources/sources.const')]);
    await prefetchQueries(context.queryClient, [sourcesQuery.queryOptions(), collectionRunsQuery.queryOptions()]);
    return { title: SOURCES_TEXT.page.title, description: SOURCES_TEXT.page.lead } satisfies PageMeta;
  },
  head,
  component: SourcesPage,
});
const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact',
  validateSearch: ContactSearchSchema,
  loader: async ({ context }) => {
    const [{ validationContextQuery }, { CONTACT_TEXT }] = await Promise.all([import('@/data/endpoints/discovery.query'), import('@/modules/contact/contact.const')]);
    await prefetchQueries(context.queryClient, [validationContextQuery.queryOptions()]);
    return { title: CONTACT_TEXT.page.title, description: CONTACT_TEXT.page.lead } satisfies PageMeta;
  },
  head,
  component: ContactPage,
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
    const [{ onThisDayQuery }, { ON_THIS_DAY_TEXT }, { formatDayMonth }] = await Promise.all([
      import('@/data/endpoints/discovery.query'),
      import('@/modules/on-this-day/on-this-day.const'),
      import('@/shared-ui/format.helper'),
    ]);
    await prefetchQueries(context.queryClient, [onThisDayQuery.queryOptions({ params: { md: params.md } })]);
    return { title: ON_THIS_DAY_TEXT.title(formatDayMonth(monthDayToIso(params.md))), description: ON_THIS_DAY_TEXT.lead } satisfies PageMeta;
  },
  head,
  component: OnThisDayPage,
});
const meRoute = privatePage('/me', MePage, accountTitle('me'));
const notificationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/me/notifications',
  validateSearch: NotificationsSearchSchema,
  component: NotificationsPage,
  ...staticMeta(async () => ({ title: await accountTitle('notifications')(), noindex: true })),
});
const myDataRoute = privatePage('/me/data', MyDataPage, accountTitle('data'));
const legalDoc = (key: 'PRIVACY_DOC' | 'TERMS_DOC' | 'COOKIES_DOC' | 'ACCESSIBILITY_DOC') => async (): Promise<PageMeta> => {
  const doc = (await import('@/modules/legal/legal.const'))[key];
  return { title: doc.title, description: doc.lead };
};
const privacyRoute = page('/legal/privacy', PrivacyPage, legalDoc('PRIVACY_DOC'));
const termsRoute = page('/legal/terms', TermsPage, legalDoc('TERMS_DOC'));
const cookiesRoute = page('/legal/cookies', CookiesPage, legalDoc('COOKIES_DOC'));
const accessibilityRoute = page('/accessibility', AccessibilityPage, legalDoc('ACCESSIBILITY_DOC'));
const criteriaRoute = page('/about/criteria', CriteriaPage, async () => {
  const { CRITERIA_DOC } = await import('@/modules/about/about.const');
  return { title: CRITERIA_DOC.title, description: CRITERIA_DOC.lead };
});
const adminRoute = privatePage('/admin', AdminHomePage, adminTitle());
/** A1–A8: one typed route per admin section (search params from @was/shared admin schemas). */
const adminPage = <P extends string, S extends typeof AdminQueueSearchSchema>(path: P, validateSearch: S, component: ReturnType<typeof lazyRouteComponent>, section: AdminSection) =>
  createRoute({ getParentRoute: () => rootRoute, path, validateSearch, component, ...staticMeta(async () => ({ title: await adminTitle(section)(), noindex: true })) });
const adminReviewRoute = adminPage('/admin/review', AdminReviewSearchSchema, AdminReviewPage, 'review');
const adminIngestionRoute = adminPage('/admin/ingestion', AdminIngestionSearchSchema, AdminIngestionPage, 'ingestion');
const adminSourcesRoute = adminPage('/admin/sources', AdminSourcesSearchSchema, AdminSourcesPage, 'sources');
const adminUsersRoute = adminPage('/admin/users', AdminUsersSearchSchema, AdminUsersPage, 'users');
const adminPrivacyRoute = adminPage('/admin/privacy', AdminQueueSearchSchema, AdminPrivacyPage, 'privacy');
const adminDossiersRoute = adminPage('/admin/dossiers', AdminQueueSearchSchema, AdminDossiersPage, 'dossiers');
const adminCommentsRoute = adminPage('/admin/comments', AdminCommentsSearchSchema, AdminCommentsPage, 'comments');
const adminContactRoute = adminPage('/admin/contact', AdminContactSearchSchema, AdminContactPage, 'contact');

export const routeTree = rootRoute.addChildren([
  homeRoute,
  hallRoute,
  athletesRoute,
  athleteRoute,
  sportsRoute,
  sportRoute,
  organizationsRoute,
  calendarRoute,
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
]);
