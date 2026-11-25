import { AdminApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { AdminController } from './admin.controller';

/** A1–A8. Access `admin` comes from the contracts (401 anonymous, 403 reader) — nothing to check here. */
export const adminRoutes = [
  defineRoute(AdminApi.summary, (_input, ctx) => new AdminController(ctx).summary()),
  defineRoute(AdminApi.proposals, (_input, ctx) => new AdminController(ctx).proposals()),
  defineRoute(AdminApi.reviewProposal, (input, ctx) => new AdminController(ctx).reviewProposal(input)),
  defineRoute(AdminApi.tierSignals, (_input, ctx) => new AdminController(ctx).tierSignals()),
  defineRoute(AdminApi.reviewTierVoteFlag, (input, ctx) => new AdminController(ctx).reviewTierVoteFlag(input)),
  defineRoute(AdminApi.ingestion, (_input, ctx) => new AdminController(ctx).ingestion()),
  defineRoute(AdminApi.identities, (_input, ctx) => new AdminController(ctx).identities()),
  defineRoute(AdminApi.decideIdentity, (input, ctx) => new AdminController(ctx).decideIdentity(input)),
  defineRoute(AdminApi.runIngestion, (input, ctx) => new AdminController(ctx).runIngestion(input)),
  defineRoute(AdminApi.sources, (_input, ctx) => new AdminController(ctx).sources()),
  defineRoute(AdminApi.updateSource, (input, ctx) => new AdminController(ctx).updateSource(input)),
  defineRoute(AdminApi.addCollectionLinks, (input, ctx) => new AdminController(ctx).addCollectionLinks(input)),
  defineRoute(AdminApi.users, (_input, ctx) => new AdminController(ctx).users()),
  defineRoute(AdminApi.updateUser, (input, ctx) => new AdminController(ctx).updateUser(input)),
  defineRoute(AdminApi.privacyRequests, (_input, ctx) => new AdminController(ctx).privacyRequests()),
  defineRoute(AdminApi.updatePrivacyRequest, (input, ctx) => new AdminController(ctx).updatePrivacyRequest(input)),
  defineRoute(AdminApi.dossiers, (_input, ctx) => new AdminController(ctx).dossiers()),
  defineRoute(AdminApi.reviewDossier, (input, ctx) => new AdminController(ctx).reviewDossier(input)),
  defineRoute(AdminApi.comments, (_input, ctx) => new AdminController(ctx).comments()),
  defineRoute(AdminApi.moderateComment, (input, ctx) => new AdminController(ctx).moderateComment(input)),
  defineRoute(AdminApi.addBannedWord, (input, ctx) => new AdminController(ctx).addBannedWord(input)),
  defineRoute(AdminApi.removeBannedWord, (input, ctx) => new AdminController(ctx).removeBannedWord(input)),
  defineRoute(AdminApi.inbox, (_input, ctx) => new AdminController(ctx).inbox()),
  defineRoute(AdminApi.reviewSuggestion, (input, ctx) => new AdminController(ctx).reviewSuggestion(input)),
  defineRoute(AdminApi.updateContactMessage, (input, ctx) => new AdminController(ctx).updateContactMessage(input)),
];
