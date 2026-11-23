import { AdminApi } from '@was/shared';

import { defineMutation, defineQuery } from '../define-endpoint.helper';
import { buildMergeCandidates, buildMergeHistory, buildMergePreview, recordDemoMerge, undoDemoMerge } from '../fixtures/admin-merge.fixture';

/** GET /api/admin/merges/candidates (D14): live competitors matching a name or slug. */
export const mergeCandidatesQuery = defineQuery(AdminApi.mergeCandidates, { sample: ({ sample, input }) => buildMergeCandidates(sample, input.query?.q) });

/** POST /api/admin/merges/preview (D14): read-only side-by-side comparison, cached like a GET. */
export const mergePreviewQuery = defineQuery(AdminApi.previewMerge, {
  sample: ({ sample, input }) => buildMergePreview(sample, input.body.survivorId, input.body.mergedId),
});

/** GET /api/admin/merges (D14): merge history, newest first. */
export const mergeHistoryQuery = defineQuery(AdminApi.listMerges, { sample: () => buildMergeHistory() });

/** POST /api/admin/merges (D14): merge with per-field winners and reason. */
export const mergeEntities = defineMutation(AdminApi.merge, ({ sample, input }) => recordDemoMerge(sample, input.body), {
  invalidates: [mergeHistoryQuery, mergeCandidatesQuery, mergePreviewQuery],
});

/** POST /api/admin/merges/:id/undo (D14): exact unmerge with reason. */
export const unmergeEntities = defineMutation(AdminApi.unmerge, ({ input }) => undoDemoMerge(input.params.id, input.body.reason), {
  invalidates: [mergeHistoryQuery, mergeCandidatesQuery, mergePreviewQuery],
});
