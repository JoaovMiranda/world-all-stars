// Compare / head-to-head (D04): two competitors side by side — sports, cross-sport band, legacy level, titles and
// medals by kind, methodology positions (same sport only) and sources.
import { z } from 'zod';

import { ACHIEVEMENT_TYPE_VALUES } from '../enums/achievement-type.enum';
import { AthleteSummarySchema } from './athlete-summary.schema';
import { AthleteBandResponseSchema, AthleteLegacyResponseSchema, CrossSportItemSchema } from './cross-sport.schema';
import { SourceRefSchema } from './source-ref.schema';
import { optionalText } from './url-filter.schema';

const SlugSchema = z.string().trim().min(1).max(200);

/** Query of GET /api/compare/head-to-head?a=<slug>&b=<slug> (two different competitors). */
export const HeadToHeadQuerySchema = z.object({ a: SlugSchema, b: SlugSchema }).refine((q) => q.a !== q.b, { message: 'a and b must differ', path: ['b'] });

/** URL search of `/compare` (share URL): both optional and tolerant; the page asks for the missing one. */
export const HeadToHeadSearchSchema = z.object({ a: optionalText(), b: optionalText() });

const HeadToHeadSportSchema = CrossSportItemSchema.shape.sport;

/** One competitor of the comparison. */
export const HeadToHeadSideSchema = z.object({
  athlete: AthleteSummarySchema,
  /** Main sport first, then the sports of the accepted band items. */
  sports: z.array(HeadToHeadSportSchema),
  band: AthleteBandResponseSchema.pick({ band: true, points: true, items: true, pendingReview: true }),
  legacy: AthleteLegacyResponseSchema.pick({ level: true, score: true, accepted: true, dossierStatus: true }),
  /** Titles, medals and placings counted per result type (only the types this competitor has). */
  titles: z.array(z.object({ type: z.enum(ACHIEVEMENT_TYPE_VALUES), count: z.number().int().positive() })),
  sources: z.array(SourceRefSchema),
});

const HeadToHeadPositionSchema = z.object({
  rank: z.number().int().positive().nullable(),
  rankTied: z.boolean(),
  score: z.number().nullable(),
});

/** Response of GET /api/compare/head-to-head. */
export const HeadToHeadResponseSchema = z.object({
  a: HeadToHeadSideSchema,
  b: HeadToHeadSideSchema,
  /** Sports both competitors share; methodology rows exist only for these. */
  sharedSports: z.array(HeadToHeadSportSchema),
  /** Published rankings of a shared sport where at least one of them is ranked (empty across sports). */
  methodology: z.array(
    z.object({
      snapshotId: z.string().min(1),
      rankingKey: z.string().nullable(),
      title: z.string().min(1),
      sport: z.string().min(1),
      a: HeadToHeadPositionSchema.nullable(),
      b: HeadToHeadPositionSchema.nullable(),
    }),
  ),
  bandRulesetVersion: z.string().min(1),
  legacyRulesetVersion: z.string().min(1),
});
