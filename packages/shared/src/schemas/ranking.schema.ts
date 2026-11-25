// Rankings API (handoff v3 §8): only PUBLISHED snapshots are public; calculation and approvals are admin-only.
import { z } from 'zod';

import { RANKING_OUTPUT_KIND_VALUES } from '../enums/ranking-output-kind.enum';
import { RANKING_SNAPSHOT_STATUS_VALUES } from '../enums/ranking-snapshot-status.enum';
import { RANKING_SORT_VALUES } from '../enums/ranking-sort.enum';
import { RankingFilterFieldsSchema } from './ranking-search.schema';
import { optionalEnum } from './url-filter.schema';

export const RankingSnapshotSummarySchema = z.object({
  id: z.string().min(1),
  rankingKey: z.string().min(1),
  methodology: z.string().min(1),
  methodologyVersion: z.string().min(1),
  sport: z.string().nullable(),
  title: z.string().min(1),
  outputKind: z.enum(RANKING_OUTPUT_KIND_VALUES),
  status: z.enum(RANKING_SNAPSHOT_STATUS_VALUES),
  entries: z.number().int().nonnegative(),
  inputHash: z.string().min(1),
  outputHash: z.string().min(1),
  approvals: z.number().int().nonnegative(),
  approvalsRequired: z.number().int().positive(),
  calculatedAt: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
});
export const RankingsListResponseSchema = z.object({ items: z.array(RankingSnapshotSummarySchema) });

export const RankingEntrySchema = z.object({
  rank: z.number().int().positive().nullable(),
  rankTied: z.boolean(),
  score: z.number().nullable(),
  band: z.string().nullable(),
  competitor: z.object({ id: z.string().min(1), name: z.string().min(1), slug: z.string().nullable(), kind: z.string().min(1), hasProfile: z.boolean() }),
  metrics: z.record(z.string(), z.number()),
  eligible: z.boolean(),
  eligibilityReason: z.string().nullable(),
});
export const RankingDetailResponseSchema = z.object({
  snapshot: RankingSnapshotSummarySchema,
  entries: z.array(RankingEntrySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
});
/** Query of GET /api/rankings/:id: page + the URL filters (T2.5, all optional; none = the whole snapshot) + sort. */
export const RankingDetailQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(200).default(50),
  })
  .extend(RankingFilterFieldsSchema.shape)
  .extend({ sort: optionalEnum(RANKING_SORT_VALUES) });

export const RankingMethodologySchema = z.object({
  key: z.string().min(1),
  version: z.string().min(1),
  sport: z.string().nullable(),
  outputKind: z.enum(RANKING_OUTPUT_KIND_VALUES),
  rankings: z.array(z.object({ key: z.string().min(1), title: z.string().min(1) })),
});
export const RankingMethodologiesResponseSchema = z.object({ items: z.array(RankingMethodologySchema) });

export const AthleteRankingsResponseSchema = z.object({
  items: z.array(
    z.object({
      snapshotId: z.string().min(1),
      title: z.string().min(1),
      rank: z.number().int().positive().nullable(),
      rankTied: z.boolean(),
      score: z.number().nullable(),
      /** Ranking key of the snapshot (methodology scope, e.g. world-cup-men). */
      rankingKey: z.string().min(1).optional(),
      /** Designation/band of the entry when the methodology outputs one (boxing: legendary…). */
      band: z.string().nullable().optional(),
    }),
  ),
});

export const CalculateRankingRequestSchema = z.object({ methodology: z.string().min(1) });
export const ApproveRankingRequestSchema = z.object({ reason: z.string().trim().min(3).max(500) });
