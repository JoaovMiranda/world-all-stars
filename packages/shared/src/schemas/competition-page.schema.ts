import { z } from 'zod';

import { COMPETITION_LEVEL_VALUES } from '../enums/competition-level.enum';
import { COMPETITION_STATUS_VALUES } from '../enums/competition-status.enum';
import { COMPETITOR_KIND_VALUES } from '../enums/competitor-kind.enum';
import { IsoDateSchema } from './iso-date.schema';
import { ContentLocaleSchema } from './locale.schema';
import { SourceRefSchema } from './source-ref.schema';
import { SportRefSchema } from './sport-ref.schema';

const slug = z.string().min(1).max(120);

/** `/api/competitions/:competition` params. */
export const CompetitionParamsSchema = z.object({ competition: slug });
/** `/api/competitions/:competition/editions/:edition` params (`edition` = edition key, usually the year). */
export const CompetitionEditionParamsSchema = CompetitionParamsSchema.extend({ edition: slug });

/** A country, historical entity or national federation a competitor represents (historical ones keep their own code). */
export const NationRefSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  flag: z.string().nullable(),
});

/** Person, team or group taking part in an edition; `slug` only when the competitor has a public profile page. */
export const CompetitorRefSchema = z.object({
  name: z.string().min(1),
  slug: z.string().nullable(),
  kind: z.enum(COMPETITOR_KIND_VALUES),
  nation: NationRefSchema.nullable(),
});

/** Short reference to an edition (lists, previous/next navigation). */
export const EditionRefSchema = z.object({
  /** URL key of the edition inside its competition (the year; `<year>-2` when a year repeats). */
  key: z.string().min(1),
  year: z.number().int().nullable(),
  label: z.string().nullable(),
});

/** One edition in the competition page list. */
export const CompetitionEditionSummarySchema = EditionRefSchema.extend({
  number: z.number().int().nullable(),
  startDate: IsoDateSchema.nullable(),
  endDate: IsoDateSchema.nullable(),
  host: NationRefSchema.nullable(),
  status: z.enum(COMPETITION_STATUS_VALUES),
  /** Entries ranked first in the edition's events (champion team or athlete). */
  winners: z.array(CompetitorRefSchema),
});

/** Header data shared by the competition page and its editions. */
export const CompetitionHeaderSchema = z.object({
  slug,
  name: z.string().min(1),
  sport: SportRefSchema.nullable(),
  organization: z.object({ slug, name: z.string().min(1) }).nullable(),
  level: z.enum(COMPETITION_LEVEL_VALUES).nullable(),
  isOlympic: z.boolean(),
  isMultiSport: z.boolean(),
  wikidataQid: z.string().nullable(),
});

/** Response of GET /api/competitions/:competition. */
export const CompetitionPageSchema = CompetitionHeaderSchema.extend({
  contentLocale: ContentLocaleSchema,
  editions: z.array(CompetitionEditionSummarySchema),
  sources: z.array(SourceRefSchema),
  /** Last change of the competition or of one of its editions (ISO datetime). */
  updatedAt: z.string().min(1),
});

/** Final placing of an entry in an event. */
export const EditionResultSchema = z.object({
  rank: z.number().int().nullable(),
  tied: z.boolean(),
  /** Result status as the domain names it (won, finished, disqualified…), translated. */
  status: z.string().min(1),
  competitor: CompetitorRefSchema,
  /** Score or mark exactly as the source wrote it ("3–1", "9.58"). */
  mark: z.string().nullable(),
});

/** A person inside an entry (squad, roster, crew). */
export const EditionMemberSchema = z.object({
  name: z.string().min(1),
  slug: z.string().nullable(),
  role: z.string().nullable(),
  position: z.string().nullable(),
  shirtNumber: z.number().int().nullable(),
});

/** Registered squad of a team (or members of a group) in an event. */
export const EditionSquadSchema = z.object({
  competitor: CompetitorRefSchema,
  members: z.array(EditionMemberSchema),
});

/** Who played a documented contest (final lineup), by side. */
export const EditionLineupSchema = z.object({
  contest: z.string().min(1),
  date: IsoDateSchema.nullable(),
  sides: z.array(
    z.object({
      competitor: CompetitorRefSchema,
      players: z.array(z.object({ name: z.string().min(1), slug: z.string().nullable(), role: z.string().min(1) })),
    }),
  ),
});

/** A race, tournament, division… of the edition with its results, squads and final lineups. */
export const EditionEventSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  category: z.string().nullable(),
  results: z.array(EditionResultSchema),
  squads: z.array(EditionSquadSchema),
  lineups: z.array(EditionLineupSchema),
});

/** Medal table row (podium places of every event, by represented nation). */
export const MedalTableRowSchema = z.object({
  nation: NationRefSchema,
  gold: z.number().int().nonnegative(),
  silver: z.number().int().nonnegative(),
  bronze: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

/** Response of GET /api/competitions/:competition/editions/:edition. */
export const EditionPageSchema = EditionRefSchema.extend({
  contentLocale: ContentLocaleSchema,
  competition: CompetitionHeaderSchema,
  number: z.number().int().nullable(),
  startDate: IsoDateSchema.nullable(),
  endDate: IsoDateSchema.nullable(),
  host: NationRefSchema.nullable(),
  hostCity: z.string().nullable(),
  status: z.enum(COMPETITION_STATUS_VALUES),
  previous: EditionRefSchema.nullable(),
  next: EditionRefSchema.nullable(),
  events: z.array(EditionEventSchema),
  /** Only when more than one event awarded podium places (multi-event editions). */
  medalTable: z.array(MedalTableRowSchema),
  sources: z.array(SourceRefSchema),
  updatedAt: z.string().min(1),
});
