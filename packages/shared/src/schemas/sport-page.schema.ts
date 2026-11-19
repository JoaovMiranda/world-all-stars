import { z } from 'zod';

import { COMPETITION_LEVEL_VALUES } from '../enums/competition-level.enum';
import { AthleteSummarySchema } from './athlete-summary.schema';
import { CompetitionEventSchema } from './calendar-event.schema';
import { ObservanceSchema } from './observance.schema';
import { OrganizationSchema, SportAssociationSchema } from './organization.schema';
import { SportInfoSchema, SportProgrammeSchema, SportRefSchema } from './sport-ref.schema';
import { ContentLocaleSchema } from './locale.schema';

/** Report of a simulated collection that found no athlete (doc 18): reason + facts with evidence. */
export const CollectionReportSchema = z.object({
  sport: z.string().min(1),
  reason_pt: z.string().min(1),
  facts: z.array(
    z.object({ text_pt: z.string().min(1), source_url: z.url(), revision: z.string().nullable(), evidence_quote: z.string().nullable() }).loose(),
  ),
});
export type CollectionReport = z.infer<typeof CollectionReportSchema>;

export const SportCompetitionSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  level: z.enum(COMPETITION_LEVEL_VALUES),
  levelOrder: z.number().int(),
  periodicity: z.string().nullable(),
  org: z.string().min(1),
  editions: z.number().int().nonnegative(),
  winnersInDb: z.number().int().nonnegative(),
});
export type SportCompetition = z.infer<typeof SportCompetitionSchema>;

/** Response of GET /api/sports/:slug (doc 09 P7). */
export const SportPageSchema = SportInfoSchema.extend({
  contentLocale: ContentLocaleSchema,
  description: z.string().nullable(),
  rules: z.string().nullable(),
  wikipedia: z.url().nullable(),
  wikidataQid: z.string().nullable(),
  pinnacle: z.string().nullable(),
  governanceInfo: z.object({ name: z.string().min(1), summary: z.string().min(1) }).nullable(),
  bodies: z.array(z.object({ name: z.string().min(1), role: z.string().min(1), chain: z.array(OrganizationSchema) })),
  prizeForms: z.array(z.string().min(1)),
  associations: z.array(SportAssociationSchema),
  collectionReport: CollectionReportSchema.nullable(),
  isTeamSport: z.boolean(),
  categories: z.array(z.object({ name: z.string().min(1), children: z.array(z.string().min(1)) })),
  competitions: z.array(SportCompetitionSchema),
  athletes: z.array(AthleteSummarySchema),
  observances: z.array(ObservanceSchema),
  upcoming: z.array(CompetitionEventSchema),
  /** Sport → discipline graph (§4.2): the parent sport and the disciplines of this one. */
  partOf: SportRefSchema.nullable().default(null),
  disciplines: z.array(SportRefSchema).default([]),
  programmes: z.array(SportProgrammeSchema).default([]),
  /** Editorial sections (handoff v3 §10): history, belts, rules… — varies by sport; facts with sources. */
  sections: z.array(z.object({ key: z.string().min(1), title: z.string().min(1), body: z.string().min(1), sources: z.array(z.string()) })).default([]),
});
export type SportPage = z.infer<typeof SportPageSchema>;

export const SportSlugParamsSchema = z.object({ slug: z.string().min(1) });
