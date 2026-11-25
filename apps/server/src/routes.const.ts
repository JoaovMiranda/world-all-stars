import type { RouteDefinition } from './http/route-definition.interface';
import { accountRoutes } from './modules/account/account.route';
import { adminRoutes } from './modules/admin/admin.route';
import { athletesRoutes } from './modules/athletes/athletes.route';
import { commentsRoutes } from './modules/comments/comments.route';
import { compareRoutes } from './modules/compare/compare.route';
import { competitionsRoutes } from './modules/competitions/competitions.route';
import { contactRoutes } from './modules/contact/contact.route';
import { crossSportRoutes } from './modules/cross-sport/cross-sport.route';
import { entityMergeRoutes } from './modules/admin/entity-merge.route';
import { discoveryRoutes } from './modules/discovery/discovery.route';
import { homeRoutes } from './modules/home/home.route';
import { interactionsRoutes } from './modules/interactions/interactions.route';
import { methodologiesRoutes } from './modules/methodologies/methodologies.route';
import { rankingsRoutes } from './modules/rankings/rankings.route';
import { sessionRoutes } from './modules/session/session.route';
import { sportsRoutes } from './modules/sports/sports.route';
import { telemetryRoutes } from './modules/telemetry/telemetry.route';
import { tierVotesRoutes } from './modules/tier-votes/tier-votes.route';

/** Every API route, each one bound to a shared contract (a test asserts all contracts are served). */
export const ALL_ROUTES: readonly RouteDefinition[] = [
  ...homeRoutes,
  ...athletesRoutes,
  ...compareRoutes,
  ...sportsRoutes,
  ...competitionsRoutes,
  ...discoveryRoutes,
  ...sessionRoutes,
  ...tierVotesRoutes,
  ...commentsRoutes,
  ...interactionsRoutes,
  ...contactRoutes,
  ...accountRoutes,
  ...adminRoutes,
  ...entityMergeRoutes,
  ...telemetryRoutes,
  ...methodologiesRoutes,
  // Before rankingsRoutes: the static `/api/rankings/all-sports` must win over `/api/rankings/:id`.
  ...crossSportRoutes,
  ...rankingsRoutes,
];
