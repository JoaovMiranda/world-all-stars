import { z } from 'zod';

import { GOVERNANCE_MODEL_VALUES } from '../enums/governance-model.enum';
import { SportAssociationSchema } from './organization.schema';
import { SportInfoSchema, SportProgrammeSchema } from './sport-ref.schema';

/** Sport card of /sports and of the home: counters + associations (logo + Wikipedia link). */
export const SportCardSchema = SportInfoSchema.extend({
  athletes: z.number().int().nonnegative(),
  mythic: z.number().int().nonnegative(),
  competitions: z.number().int().nonnegative(),
  associations: z.array(SportAssociationSchema),
  /** Multi-sport programmes the sport is part of (badges + filter on /sports). */
  programmes: z.array(SportProgrammeSchema).default([]),
  /** Slug of the sport this one is a discipline of (Cycling › BMX racing), when any. */
  partOf: z.string().nullable().default(null),
});

/** Response item of GET /api/sports: group › subgroup › sports. */
export const SportGroupSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  subgroups: z.array(z.object({ slug: z.string().min(1), name: z.string().min(1), sports: z.array(SportCardSchema) })),
});
export const SportsTreeResponseSchema = z.array(SportGroupSchema);

/** Response item of GET /api/governance-models (doc 18). */
export const GovernanceModelSchema = z.object({
  slug: z.enum(GOVERNANCE_MODEL_VALUES),
  name: z.string().min(1),
  summary: z.string().min(1),
  sports: z.array(SportInfoSchema),
});
export const GovernanceModelsResponseSchema = z.array(GovernanceModelSchema);
