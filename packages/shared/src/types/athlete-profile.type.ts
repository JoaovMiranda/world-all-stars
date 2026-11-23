import type { z } from 'zod';

import type {
  AchievementSchema,
  AthleteProfileSchema,
  AthleteSlugParamsSchema,
  DossierSchema,
  FieldConflictSchema,
  FieldProvenanceSchema,
  LegacyScoreSchema,
  MilestoneSchema,
  TeamStintSchema,
  TitleReignSchema,
} from '../schemas/athlete-profile.schema';

export type Achievement = z.infer<typeof AchievementSchema>;
export type TeamStint = z.infer<typeof TeamStintSchema>;
export type TitleReign = z.infer<typeof TitleReignSchema>;
export type Milestone = z.infer<typeof MilestoneSchema>;
export type Dossier = z.infer<typeof DossierSchema>;
export type FieldProvenance = z.infer<typeof FieldProvenanceSchema>;
export type FieldConflict = z.infer<typeof FieldConflictSchema>;
export type LegacyScore = z.infer<typeof LegacyScoreSchema>;
export type AthleteProfile = z.infer<typeof AthleteProfileSchema>;
export type AthleteSlugParams = z.infer<typeof AthleteSlugParamsSchema>;
