// Cross-sport bands S–D (D07) and legacy levels L1–L5 (D11): public readouts computed from published data.
import { z } from 'zod';

import { CROSS_SPORT_BAND_VALUES } from '../enums/cross-sport-band.enum';
import { CROSS_SPORT_ERA_VALUES } from '../enums/cross-sport-era.enum';
import { LEGACY_LEVEL_VALUES } from '../enums/legacy-level.enum';
import { optionalEnum, optionalPage, optionalText } from './url-filter.schema';

/** URL filters of `/rankings/all-sports` (and the query of its endpoint). */
export const CrossSportFiltersSchema = z.object({
  sport: optionalText(),
  gender: optionalEnum(['male', 'female']),
  era: optionalEnum(CROSS_SPORT_ERA_VALUES),
  page: optionalPage(),
});

const BandSchema = z.enum(CROSS_SPORT_BAND_VALUES);
const SportRefSchema = z.object({ slug: z.string().min(1), name: z.string().min(1) });

/** One accepted item of a competitor: a published grant mapped to a band. */
export const CrossSportItemSchema = z.object({
  evidenceId: z.string().min(1),
  band: BandSchema,
  points: z.number().nonnegative(),
  label: z.string().min(1),
  sport: SportRefSchema,
  year: z.number().int().nullable(),
});

export const CrossSportEntrySchema = z.object({
  competitor: z.object({ id: z.string().min(1), name: z.string().min(1), slug: z.string().min(1) }),
  band: BandSchema,
  points: z.number().nonnegative(),
  sports: z.array(SportRefSchema),
  items: z.array(CrossSportItemSchema),
  /** Competitive facts of this competitor still waiting for a mapping (shown, never counted as zero). */
  pendingReview: z.number().int().nonnegative(),
});

const RunSchema = z.object({ rulesetVersion: z.string().min(1), inputHash: z.string().min(1), outputHash: z.string().min(1) });

export const CrossSportListResponseSchema = RunSchema.extend({
  groups: z.array(
    z.object({ band: BandSchema, points: z.number().nonnegative(), total: z.number().int().nonnegative(), entries: z.array(CrossSportEntrySchema) }),
  ),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  /** Sports present in the bands (filter options). */
  sports: z.array(SportRefSchema),
  unmappedTotal: z.number().int().nonnegative(),
});

export const CrossSportMethodologyResponseSchema = RunSchema.extend({
  bands: z.array(z.object({ band: BandSchema, points: z.number().nonnegative() })),
  rulesets: z.array(
    z.object({
      sport: z.string().min(1),
      /** Sport name in the request locale (the slug when the sport has no row, e.g. `multi-sport`). */
      name: z.string().min(1),
      rulesetKey: z.string().min(1),
      hash: z.string().min(1),
      mappings: z.array(
        z.object({
          kind: z.string().min(1),
          value: z.string().min(1),
          band: BandSchema,
          fromYear: z.number().int().nullable(),
          toYear: z.number().int().nullable(),
          sourceNote: z.string().nullable(),
        }),
      ),
    }),
  ),
  competitors: z.number().int().nonnegative(),
  unmappedTotal: z.number().int().nonnegative(),
});

export const AthleteBandResponseSchema = z.object({
  slug: z.string().min(1),
  rulesetVersion: z.string().min(1),
  /** Hash of this athlete's readout (same facts + same mappings → same hash). */
  outputHash: z.string().min(1),
  band: BandSchema.nullable(),
  points: z.number().nonnegative(),
  items: z.array(CrossSportItemSchema),
  pendingReview: z.number().int().nonnegative(),
});

export const CrossSportUnmappedResponseSchema = z.object({
  rulesetVersion: z.string().min(1),
  total: z.number().int().nonnegative(),
  items: z.array(
    z.object({
      evidenceId: z.string().min(1),
      competitor: z.object({ id: z.string().min(1), name: z.string().min(1), slug: z.string().min(1) }),
      sport: z.string().min(1),
      kind: z.enum(['recognition', 'result']),
      value: z.string().min(1),
      label: z.string().min(1),
      year: z.number().int().nullable(),
      error: z.string().min(1),
    }),
  ),
});

export const AthleteLegacyResponseSchema = z.object({
  slug: z.string().min(1),
  rulesetVersion: z.string().min(1),
  level: z.enum(LEGACY_LEVEL_VALUES),
  score: z.number().nonnegative(),
  accepted: z.array(
    z.object({
      evidenceId: z.string().min(1),
      kind: z.string().min(1),
      label: z.string().min(1),
      points: z.number().nonnegative(),
      year: z.number().int().nullable(),
    }),
  ),
  excluded: z.array(z.object({ evidenceId: z.string().min(1), label: z.string().min(1), reason: z.string().min(1) })),
  /** Status of the Hall of Greats dossier (L5 gate), null without one. */
  dossierStatus: z.string().nullable(),
  /** Score at or above the L5 threshold (the dossier decides whether L5 is granted). */
  l5Threshold: z.number().nonnegative(),
  explanation: z.string().min(1),
});
