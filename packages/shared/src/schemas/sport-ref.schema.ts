import { z } from 'zod';

import { GOVERNANCE_MODEL_VALUES } from '../enums/governance-model.enum';

/** Minimal reference to a sport. `colorToken` is a CSS token name without dashes (e.g. `c-teal`, `success`). */
export const SportRefSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  colorToken: z.string().min(1),
});
export type SportRef = z.infer<typeof SportRefSchema>;

/** Sport with taxonomy path and classification (repository `sportOf`). */
export const SportInfoSchema = SportRefSchema.extend({
  id: z.string().min(1),
  /** Key of the sport-specific stats schema (football, swimming, chess…). */
  statsSchema: z.string().min(1),
  group: z.string().min(1),
  groupSlug: z.string().min(1),
  subgroup: z.string().min(1),
  environment: z.string().min(1),
  format: z.string().min(1),
  governance: z.enum(GOVERNANCE_MODEL_VALUES).nullable(),
});
export type SportInfo = z.infer<typeof SportInfoSchema>;

/** Presence of a sport in a multi-sport programme (Olympics, World Games…): a badge, never a container (§11.5). */
export const SportProgrammeSchema = z.object({
  /** Multi-sport event slug (olympic-games-summer, world-games…). */
  slug: z.string().min(1),
  name: z.string().min(1),
  /** current · discontinued · demonstration · confirmed_future · core · optional · recognized · youth_only */
  status: z.string().min(1),
  years: z.array(z.number().int()).default([]),
});
export type SportProgramme = z.infer<typeof SportProgrammeSchema>;
