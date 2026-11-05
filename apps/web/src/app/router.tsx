import {
  AdminCommentsSearchSchema,
  AdminContactSearchSchema,
  AdminIngestionSearchSchema,
  AdminQueueSearchSchema,
  AdminReviewSearchSchema,
  AdminSourcesSearchSchema,
  AdminUsersSearchSchema,
  AthleteFiltersSchema,
  AthleteProfileSearchSchema,
  ContactSearchSchema,
  HomeSearchSchema,
  MonthDaySchema,
  NotificationsSearchSchema,
  SourcesFiltersSchema,
  SportPageFiltersSchema,
  SportsFiltersSchema,
} from '@was/shared';
import { createRootRoute, createRoute, createRouter, lazyRouteComponent, notFound, redirect } from '@tanstack/react-router';


import { ErrorPage } from '@/modules/errors/error.page';
import { NotFoundPage } from '@/modules/errors/not-found.page';

import { RootLayout } from './root-layout.component';

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

const rootRoute = createRootRoute({ component: RootLayout, notFoundComponent: NotFoundPage });
const page = <P extends string>(path: P, component: ReturnType<typeof lazyRouteComponent>) => createRoute({ getParentRoute: () => rootRoute, path, component });

const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: '/', validateSearch: HomeSearchSchema, component: HomePage });
const hallRoute = page('/hall-of-greats', HallOfGreatsPage);
const athletesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/athletes', validateSearch: AthleteFiltersSchema, component: AthletesPage });
const athleteRoute = createRoute({ getParentRoute: () => rootRoute, path: '/athletes/$slug', validateSearch: AthleteProfileSearchSchema, component: AthleteProfilePage });
const sportsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sports', validateSearch: SportsFiltersSchema, component: SportsPage });
const sportRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sports/$slug', validateSearch: SportPageFiltersSchema, component: SportPage });
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
const sourcesRoute = createRoute({ getParentRoute: () => rootRoute, path: '/sources', validateSearch: SourcesFiltersSchema, component: SourcesPage });
const contactRoute = createRoute({ getParentRoute: () => rootRoute, path: '/contact', validateSearch: ContactSearchSchema, component: ContactPage });
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
  component: OnThisDayPage,
});
const meRoute = page('/me', MePage);
const notificationsRoute = createRoute({ getParentRoute: () => rootRoute, path: '/me/notifications', validateSearch: NotificationsSearchSchema, component: NotificationsPage });
const myDataRoute = page('/me/data', MyDataPage);
const privacyRoute = page('/legal/privacy', PrivacyPage);
const termsRoute = page('/legal/terms', TermsPage);
const cookiesRoute = page('/legal/cookies', CookiesPage);
const accessibilityRoute = page('/accessibility', AccessibilityPage);
const criteriaRoute = page('/about/criteria', CriteriaPage);
const adminRoute = page('/admin', AdminHomePage);
/** A1–A8: one typed route per admin section (search params from @was/shared admin schemas). */
const adminPage = <P extends string, S extends typeof AdminQueueSearchSchema>(path: P, validateSearch: S, component: ReturnType<typeof lazyRouteComponent>) =>
  createRoute({ getParentRoute: () => rootRoute, path, validateSearch, component });
const adminReviewRoute = adminPage('/admin/review', AdminReviewSearchSchema, AdminReviewPage);
const adminIngestionRoute = adminPage('/admin/ingestion', AdminIngestionSearchSchema, AdminIngestionPage);
const adminSourcesRoute = adminPage('/admin/sources', AdminSourcesSearchSchema, AdminSourcesPage);
const adminUsersRoute = adminPage('/admin/users', AdminUsersSearchSchema, AdminUsersPage);
const adminPrivacyRoute = adminPage('/admin/privacy', AdminQueueSearchSchema, AdminPrivacyPage);
const adminDossiersRoute = adminPage('/admin/dossiers', AdminQueueSearchSchema, AdminDossiersPage);
const adminCommentsRoute = adminPage('/admin/comments', AdminCommentsSearchSchema, AdminCommentsPage);
const adminContactRoute = adminPage('/admin/contact', AdminContactSearchSchema, AdminContactPage);

const routeTree = rootRoute.addChildren([
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

export const router = createRouter({ routeTree, defaultPreload: 'intent', scrollRestoration: true, defaultErrorComponent: ErrorPage });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
