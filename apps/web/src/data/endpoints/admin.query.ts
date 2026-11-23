import { AdminApi } from '@was/shared';
import { defineMutation, defineQuery } from '../define-endpoint.helper';
import { demoStore } from '../demo.store';
import {
  addDemoBannedWord,
  addDemoCollectionLinks,
  buildAdminComments,
  buildAdminInbox,
  buildAdminSummary,
  buildDossiers,
  buildIngestion,
  buildPrivacy,
  buildProposals,
  buildSources,
  buildTierSignals,
  buildUsers,
  recordCommentModeration,
  removeDemoBannedWord,
  reviewDemoDossier,
  reviewDemoProposal,
  reviewDemoSuggestion,
  runDemoIngestion,
  updateDemoMessage,
  updateDemoPrivacy,
  updateDemoSource,
  updateDemoUser,
} from '../fixtures/admin.fixture';
import { commentsQuery } from './comments.query';

/** GET /api/admin/summary: pending items per section (admin navigation badges, Painel). */
export const adminSummaryQuery = defineQuery(AdminApi.summary, { sample: ({ sample }) => buildAdminSummary(sample) });

/** GET /api/admin/proposals (A1): crawler/AI proposals and field conflicts (+ demo decisions). */
export const adminProposalsQuery = defineQuery(AdminApi.proposals, { sample: ({ sample }) => buildProposals(sample) });

/** PATCH /api/admin/proposals/:id (A1): approve/reject with reason. */
export const reviewProposal = defineMutation(
  AdminApi.reviewProposal,
  ({ input, sample, session }) => reviewDemoProposal(sample, session, input.params.id, input.body.decision, input.body.reason),
  { invalidates: [adminProposalsQuery, adminSummaryQuery] },
);

/** GET /api/admin/identities (A1, handoff v3 §7.1): ambiguous competitors (the fixture mode has none). */
export const adminIdentitiesQuery = defineQuery(AdminApi.identities, { sample: () => ({ items: [] }) });

/** PATCH /api/admin/identities/:id: match / create / reject with reason. */
export const decideIdentity = defineMutation(AdminApi.decideIdentity, () => ({ ok: true as const }), {
  invalidates: [adminIdentitiesQuery, adminSummaryQuery],
});

/** GET /api/admin/tier-signals (A1, doc 17): reader votes vs official tier. */
export const adminTierSignalsQuery = defineQuery(AdminApi.tierSignals, { sample: ({ sample }) => buildTierSignals(sample) });

/** GET /api/admin/ingestion-runs (A2): runs, gates, tokens, logs and the AI queue. */
export const adminIngestionQuery = defineQuery(AdminApi.ingestion, { sample: ({ sample }) => buildIngestion(sample) });

/** POST /api/admin/ingestion-runs (A2): "run now" (simulated). */
export const runIngestion = defineMutation(AdminApi.runIngestion, ({ input, sample, session }) => runDemoIngestion(sample, session, input.body.jobKey), {
  invalidates: [adminIngestionQuery, adminSummaryQuery],
});

/** GET /api/admin/sources (A3): registry with usage status/license review + links queued for collection. */
export const adminSourcesQuery = defineQuery(AdminApi.sources, { sample: ({ sample }) => buildSources(sample) });

/** PATCH /api/admin/sources/:id (A3). */
export const updateSource = defineMutation(
  AdminApi.updateSource,
  ({ input, sample, session }) => updateDemoSource(sample, session, input.params.id, input.body),
  {
    invalidates: [adminSourcesQuery, adminSummaryQuery],
  },
);

/** POST /api/admin/source-links (A3): athlete + links to the collection (checked with checkSourceUrl). */
export const addCollectionLinks = defineMutation(
  AdminApi.addCollectionLinks,
  ({ input, sample, session }) => addDemoCollectionLinks(sample, session, input.body),
  {
    invalidates: [adminSourcesQuery, adminSummaryQuery],
  },
);

/** GET /api/admin/users (A4): accounts + audit log. */
export const adminUsersQuery = defineQuery(AdminApi.users, { sample: ({ sample }) => buildUsers(sample) });

/** PATCH /api/admin/users/:id (A4): promote/demote/ban/unban with reason. */
export const updateUser = defineMutation(AdminApi.updateUser, ({ input, sample, session }) => updateDemoUser(sample, session, input.params.id, input.body), {
  invalidates: [adminUsersQuery],
});

/** GET /api/admin/privacy-requests (A5). */
export const adminPrivacyQuery = defineQuery(AdminApi.privacyRequests, { sample: ({ sample }) => buildPrivacy(sample) });

/** PATCH /api/admin/privacy-requests/:id (A5). */
export const updatePrivacyRequest = defineMutation(
  AdminApi.updatePrivacyRequest,
  ({ input, sample, session }) => updateDemoPrivacy(sample, session, input.params.id, input.body.status, input.body.note),
  { invalidates: [adminPrivacyQuery, adminSummaryQuery, adminUsersQuery] },
);

/** GET /api/admin/dossiers (A6). */
export const adminDossiersQuery = defineQuery(AdminApi.dossiers, { sample: ({ sample }) => buildDossiers(sample) });

/** PATCH /api/admin/dossiers/:id (A6): approval 1 of 2 (different admins) or rejection, with reason. */
export const reviewDossier = defineMutation(
  AdminApi.reviewDossier,
  ({ input, sample, session }) => reviewDemoDossier(sample, session, input.params.id, input.body.decision, input.body.reason),
  { invalidates: [adminDossiersQuery, adminSummaryQuery, adminUsersQuery] },
);

/** GET /api/admin/comments (A7): moderation queue + banned words. */
export const adminCommentsQuery = defineQuery(AdminApi.comments, { sample: ({ sample }) => buildAdminComments(sample) });

/** PATCH /api/admin/comments/:id: hide/show with reason. */
export const moderateComment = defineMutation(
  AdminApi.moderateComment,
  ({ input, session }) => {
    demoStore.update((d) => {
      if (input.body.status === 'hidden') d.hiddenComments[input.params.id] = input.body.reason;
      else delete d.hiddenComments[input.params.id];
    });
    return session.user ? recordCommentModeration(session, input.params.id, input.body.reason) : { ok: true as const };
  },
  { invalidates: [adminCommentsQuery, commentsQuery, adminSummaryQuery, adminUsersQuery] },
);

/** POST /api/admin/banned-words (A7). */
export const addBannedWord = defineMutation(AdminApi.addBannedWord, ({ input, sample, session }) => addDemoBannedWord(sample, session, input.body), {
  invalidates: [adminCommentsQuery, adminUsersQuery],
});

/** DELETE /api/admin/banned-words/:locale/:term (A7). */
export const removeBannedWord = defineMutation(AdminApi.removeBannedWord, ({ input, session }) => removeDemoBannedWord(session, input.params), {
  invalidates: [adminCommentsQuery, adminUsersQuery],
});

/** GET /api/admin/inbox (A8): suggestions + contact messages (sample + demo submissions + demo decisions). */
export const adminInboxQuery = defineQuery(AdminApi.inbox, { sample: ({ sample }) => buildAdminInbox(sample) });

/** PATCH /api/admin/suggestions/:id: approve (→ collection links) / reject / duplicate. */
export const reviewSuggestion = defineMutation(
  AdminApi.reviewSuggestion,
  async ({ input, sample, session }) => {
    if (session.user) await reviewDemoSuggestion(sample, session, input.params.id, input.body.status, input.body.note);
    demoStore.update((d) => {
      d.reviewedSuggestions[input.params.id] = input.body.status;
    });
    return { ok: true as const };
  },
  { invalidates: [adminInboxQuery, adminSourcesQuery, adminSummaryQuery, adminUsersQuery] },
);

/** PATCH /api/admin/contact/:id (A8): new → answered → closed. */
export const updateContactMessage = defineMutation(
  AdminApi.updateContactMessage,
  ({ input, session }) => updateDemoMessage(session, input.params.id, input.body.status),
  {
    invalidates: [adminInboxQuery, adminSummaryQuery, adminUsersQuery],
  },
);
