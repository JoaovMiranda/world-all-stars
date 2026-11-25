import type { z } from 'zod';

import type {
  CompetitionEditionParamsSchema,
  CompetitionEditionSummarySchema,
  CompetitionHeaderSchema,
  CompetitionPageSchema,
  CompetitionParamsSchema,
  CompetitorRefSchema,
  EditionEventSchema,
  EditionLineupSchema,
  EditionMemberSchema,
  EditionPageSchema,
  EditionRefSchema,
  EditionResultSchema,
  EditionSquadSchema,
  MedalTableRowSchema,
  NationRefSchema,
} from '../schemas/competition-page.schema';

export type CompetitionParams = z.infer<typeof CompetitionParamsSchema>;
export type CompetitionEditionParams = z.infer<typeof CompetitionEditionParamsSchema>;
export type NationRef = z.infer<typeof NationRefSchema>;
export type CompetitorRef = z.infer<typeof CompetitorRefSchema>;
export type EditionRef = z.infer<typeof EditionRefSchema>;
export type CompetitionEditionSummary = z.infer<typeof CompetitionEditionSummarySchema>;
export type CompetitionHeader = z.infer<typeof CompetitionHeaderSchema>;
export type CompetitionPage = z.infer<typeof CompetitionPageSchema>;
export type EditionResult = z.infer<typeof EditionResultSchema>;
export type EditionMember = z.infer<typeof EditionMemberSchema>;
export type EditionSquad = z.infer<typeof EditionSquadSchema>;
export type EditionLineup = z.infer<typeof EditionLineupSchema>;
export type EditionEvent = z.infer<typeof EditionEventSchema>;
export type MedalTableRow = z.infer<typeof MedalTableRowSchema>;
export type EditionPage = z.infer<typeof EditionPageSchema>;
