import { z } from 'zod';

export const OlympicMedalsConfigSchema = z.object({
  sports: z.array(z.string()).default([]),
  weights: z.object({ gold: z.number().default(3), silver: z.number().default(2), bronze: z.number().default(1) }).default({ gold: 3, silver: 2, bronze: 1 }),
  teamMedalCreditsMembers: z.boolean().default(true),
});
