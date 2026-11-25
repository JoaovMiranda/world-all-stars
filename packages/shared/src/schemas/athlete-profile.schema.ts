import { z } from 'zod';
import { AchievementKind } from '../enums/achievement-kind.enum';
import { ACHIEVEMENT_TYPE_VALUES } from '../enums/achievement-type.enum';
import { COMPETITION_LEVEL_VALUES } from '../enums/competition-level.enum';
import { DOSSIER_STATUS_VALUES } from '../enums/dossier-status.enum';
import { ON_THIS_DAY_KIND_VALUES } from '../enums/on-this-day-kind.enum';
import { TIER_VALUES } from '../enums/tier.enum';
import { AthleteStatsSchema } from './athlete-stats.schema';
import { AthleteSummarySchema } from './athlete-summary.schema';
import { InteractionCountsSchema } from './competitor-interaction.schema';
import { CountryRefSchema } from './country-ref.schema';
import { IsoDateSchema } from './iso-date.schema';
import { ContentLocaleSchema } from './locale.schema';
import { SourceRefSchema } from './source-ref.schema';

const level = z.enum(COMPETITION_LEVEL_VALUES);
const achievementBase = {
  id: z.string().min(1),
  type: z.enum(ACHIEVEMENT_TYPE_VALUES),
  /** rank_weight of the result type (legacy score). */
  weight: z.number(),
  year: z.number().int(),
  date: IsoDateSchema.nullable(),
  level,
  levelWeight: z.number(),
  rank: z.number().int().nullable(),
  source: SourceRefSchema.nullable(),
};

/** One class of the division a result was earned in (belt, gi mode, weight, sex, age…), as the organization names it. */
export const DivisionClassSchema = z.object({
  /** Dimension slug (category_dimensions.slug: belt, gi_mode, weight, sex_category, age…). */
  dimension: z.string().min(1),
  /** Value slug (category_values.slug: black, no-gi, absolute…). */
  value: z.string().min(1),
  /** Label in the request language, or the organization's original label. */
  label: z.string().min(1),
});

export const CompetitionAchievementSchema = z.object({
  ...achievementBase,
  kind: z.literal(AchievementKind.Competition),
  competition: z.object({ slug: z.string().min(1), name: z.string().min(1) }),
  edition: z.object({ label: z.string().nullable(), number: z.number().int().nullable(), host: CountryRefSchema.nullable() }),
  isOlympic: z.boolean(),
  category: z.string().nullable(),
  team: z.string().nullable(),
  /** Classes of the division (BJJ belt, gi/no-gi, weight, absolute…); present only when the division has classes. */
  classes: z.array(DivisionClassSchema).optional(),
});
export const AwardAchievementSchema = z.object({
  ...achievementBase,
  kind: z.literal(AchievementKind.Award),
  award: z.object({ slug: z.string().min(1), name: z.string().min(1), kind: z.string().min(1) }),
  label: z.string().nullable(),
});
/** A title, medal, placing or award (competition edition OR award edition). */
export const AchievementSchema = z.discriminatedUnion('kind', [CompetitionAchievementSchema, AwardAchievementSchema]);

export const CityRefSchema = z.object({ name: z.string().min(1), region: z.string().nullable(), country: CountryRefSchema.nullable() });
export const LifeEventSchema = z.object({ date: IsoDateSchema.nullable(), city: CityRefSchema.nullable() });

export const TeamStintSchema = z.object({
  name: z.string().min(1),
  kind: z.string().min(1),
  country: CountryRefSchema.nullable(),
  from: z.number().int().nullable(),
  to: z.number().int().nullable(),
  fromDate: IsoDateSchema.nullable(),
  toDate: IsoDateSchema.nullable(),
  role: z.string().nullable(),
});

export const TitleReignSchema = z.object({
  competition: z.string().min(1),
  won: IsoDateSchema,
  lost: IsoDateSchema.nullable(),
  endReason: z.string().nullable(),
  source: SourceRefSchema.nullable(),
});

export const MilestoneSchema = z.object({
  date: IsoDateSchema,
  kind: z.enum(ON_THIS_DAY_KIND_VALUES),
  title: z.string().min(1),
  source: SourceRefSchema.nullable(),
});

/** "Mudou o jogo" dossier (Hall of Greats): headline + evidences, approved by 2 admins. */
export const DossierSchema = z.object({
  status: z.enum(DOSSIER_STATUS_VALUES),
  approvals: z.number().int().nonnegative(),
  headline: z.string().nullable(),
  evidences: z.array(z.object({ type: z.string().min(1), text: z.string().min(1), source: SourceRefSchema.nullable() })),
});

export const TierChangeSchema = z.object({
  from: z.enum(TIER_VALUES),
  to: z.enum(TIER_VALUES),
  reason: z.string().min(1),
  at: IsoDateSchema,
});

/** Origin of one profile field (Sources tab, ⓘ per field). */
export const FieldProvenanceSchema = z.object({
  field: z.string().min(1),
  ref: z.string().nullable(),
  retrievedAt: IsoDateSchema.nullable(),
  source: SourceRefSchema.nullable(),
});

/** Two sources disagree on a field: chosen value vs other value. */
export const FieldConflictSchema = z.object({
  field: z.string().min(1),
  chosen: z.object({ value: z.string(), source: SourceRefSchema.nullable() }),
  other: z.object({ value: z.string(), source: SourceRefSchema.nullable() }),
  resolution: z.string().min(1),
});

/** Legacy score breakdown: Σ rank_weight × level weight (doc 03/16). */
export const LegacyScoreSchema = z.object({
  total: z.number().nonnegative(),
  rows: z.array(z.object({ level, type: z.string().min(1), count: z.number().int().nonnegative(), points: z.number().nonnegative(), unit: z.number() })),
});

export const EntityVersionSchema = z.object({ n: z.number().int().positive(), summary: z.string().min(1), author: z.string().min(1) });

/** Response of GET /api/athletes/:slug: every tab of the profile (doc 09 P2). */
export const AthleteProfileSchema = AthleteSummarySchema.extend({
  contentLocale: ContentLocaleSchema,
  wikidataQid: z.string().nullable(),
  fullName: z.string().nullable(),
  nicknames: z.array(z.string()),
  position: z.string().nullable(),
  category: z.string().nullable(),
  birth: LifeEventSchema,
  death: LifeEventSchema.nullable(),
  heightCm: z.number().nullable(),
  dominantFoot: z.string().nullable(),
  shortBio: z.string().nullable(),
  externalIds: z.record(z.string(), z.string()),
  social: z.record(z.string(), z.string()),
  inclusionReason: z.string().nullable(),
  achievements: z.array(AchievementSchema),
  teams: z.array(TeamStintSchema),
  stats: AthleteStatsSchema.nullable(),
  reigns: z.array(TitleReignSchema),
  milestones: z.array(MilestoneSchema),
  dossier: DossierSchema.nullable(),
  tierHistory: z.array(TierChangeSchema),
  provenance: z.array(FieldProvenanceSchema),
  conflicts: z.array(FieldConflictSchema),
  legacy: LegacyScoreSchema,
  version: z.object({ current: z.number().int().positive(), history: z.array(EntityVersionSchema) }),
  sourceLinks: z.array(SourceRefSchema),
  /** Public star/heart counts (D03); absent when nobody starred or hearted the competitor yet. */
  interactions: InteractionCountsSchema.optional(),
});

/** Path params of every /api/athletes/:slug/* endpoint. */
export const AthleteSlugParamsSchema = z.object({ slug: z.string().min(1) });
