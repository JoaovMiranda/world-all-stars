import { AdminApi, adminPendingCounts } from '@was/shared';

import type { RequestContext } from '../../http/app-context.type';
import { defineRoute } from '../../http/contract-route.helper';
import { addCollectionLinks, listAdminSources, listIngestion, runIngestion, updateSource } from './admin-collection.service';
import {
  addBannedWord,
  listAdminComments,
  listInbox,
  listPrivacy,
  listUsers,
  moderateComment,
  removeBannedWord,
  reviewSuggestion,
  updateContactMessage,
  updatePrivacy,
  updateUser,
} from './admin-community.service';
import { listDossiers, listProposals, listTierSignals, reviewDossier, reviewProposal } from './admin-review.service';

/** Painel: the same queues as each section, counted by the shared rule (adminPendingCounts). */
const summary = async (ctx: RequestContext) => {
  const [proposals, signals, ingestion, sources, comments, inbox, dossiers, privacy] = await Promise.all([
    listProposals(ctx), listTierSignals(ctx), listIngestion(ctx), listAdminSources(ctx), listAdminComments(ctx), listInbox(ctx), listDossiers(ctx), listPrivacy(ctx),
  ]);
  return {
    pending: adminPendingCounts({ proposals: proposals.items, signals: signals.items, runs: ingestion.runs, sources, comments: comments.items, inbox, dossiers: dossiers.items, privacy: privacy.items }),
  };
};

/** A1–A8. Access `admin` comes from the contracts (401 anonymous, 403 reader) — nothing to check here. */
export const adminRoutes = [
  defineRoute(AdminApi.summary, (_, ctx) => summary(ctx)),
  defineRoute(AdminApi.proposals, (_, ctx) => listProposals(ctx)),
  defineRoute(AdminApi.reviewProposal, ({ params, body }, ctx) => reviewProposal(ctx, params.id, body.decision, body.reason)),
  defineRoute(AdminApi.tierSignals, (_, ctx) => listTierSignals(ctx)),
  defineRoute(AdminApi.ingestion, (_, ctx) => listIngestion(ctx)),
  defineRoute(AdminApi.runIngestion, ({ body }, ctx) => runIngestion(ctx, body.jobKey)),
  defineRoute(AdminApi.sources, (_, ctx) => listAdminSources(ctx)),
  defineRoute(AdminApi.updateSource, ({ params, body }, ctx) => updateSource(ctx, params.id, body)),
  defineRoute(AdminApi.addCollectionLinks, ({ body }, ctx) => addCollectionLinks(ctx, body)),
  defineRoute(AdminApi.users, (_, ctx) => listUsers(ctx)),
  defineRoute(AdminApi.updateUser, ({ params, body }, ctx) => updateUser(ctx, params.id, body)),
  defineRoute(AdminApi.privacyRequests, (_, ctx) => listPrivacy(ctx)),
  defineRoute(AdminApi.updatePrivacyRequest, ({ params, body }, ctx) => updatePrivacy(ctx, params.id, body.status, body.note)),
  defineRoute(AdminApi.dossiers, (_, ctx) => listDossiers(ctx)),
  defineRoute(AdminApi.reviewDossier, ({ params, body }, ctx) => reviewDossier(ctx, params.id, body.decision, body.reason)),
  defineRoute(AdminApi.comments, (_, ctx) => listAdminComments(ctx)),
  defineRoute(AdminApi.moderateComment, ({ params, body }, ctx) => moderateComment(ctx, params.id, body.status, body.reason)),
  defineRoute(AdminApi.addBannedWord, ({ body }, ctx) => addBannedWord(ctx, body)),
  defineRoute(AdminApi.removeBannedWord, ({ params }, ctx) => removeBannedWord(ctx, params)),
  defineRoute(AdminApi.inbox, (_, ctx) => listInbox(ctx)),
  defineRoute(AdminApi.reviewSuggestion, ({ params, body }, ctx) => reviewSuggestion(ctx, params.id, body.status, body.note)),
  defineRoute(AdminApi.updateContactMessage, ({ params, body }, ctx) => updateContactMessage(ctx, params.id, body.status)),
];
