import type { RouteDefinition } from './http/route-definition.interface';
import { accountRoutes } from './modules/account/account.route';
import { adminRoutes } from './modules/admin/admin.route';
import { athletesRoutes } from './modules/athletes/athletes.route';
import { commentsRoutes } from './modules/comments/comments.route';
import { contactRoutes } from './modules/contact/contact.route';
import { entityMergeRoutes } from './modules/admin/entity-merge.route';
import { discoveryRoutes } from './modules/discovery/discovery.route';
import { homeRoutes } from './modules/home/home.route';
import { rankingsRoutes } from './modules/rankings/rankings.route';
import { sessionRoutes } from './modules/session/session.route';
import { sportsRoutes } from './modules/sports/sports.route';
import { telemetryRoutes } from './modules/telemetry/telemetry.route';
import { tierVotesRoutes } from './modules/tier-votes/tier-votes.route';

/** Every API route, each one bound to a shared contract (a test asserts all contracts are served). */
export const ALL_ROUTES: readonly RouteDefinition[] = [
  ...homeRoutes,
  ...athletesRoutes,
  ...sportsRoutes,
  ...discoveryRoutes,
  ...sessionRoutes,
  ...tierVotesRoutes,
  ...commentsRoutes,
  ...contactRoutes,
  ...accountRoutes,
  ...adminRoutes,
  ...entityMergeRoutes,
  ...telemetryRoutes,
  ...rankingsRoutes,
];
