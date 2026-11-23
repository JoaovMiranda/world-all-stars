import { z } from 'zod';

export const BoxingConfigSchema = z.object({
  divisions: z.array(z.string()).default([]),
  organizationPoints: z.record(z.string(), z.number()).default({ ring: 3, wba: 4, wbc: 4, ibf: 4, wbo: 4, ibo: 2 }),
  undisputedPoints: z.number().default(10),
  defensePoints: z.number().default(1),
  divisionPoints: z.number().default(2),
  olympicPoints: z.record(z.string(), z.number()).default({ gold: 6, silver: 3, bronze: 1 }),
  longevityStartYear: z.number().int().default(10),
  longevityCap: z.number().int().default(10),
  hallOfFamePoints: z.number().default(5),
  designations: z
    .object({ mythical: z.number().default(80), legendary: z.number().default(50), champion: z.number().default(20) })
    .default({ mythical: 80, legendary: 50, champion: 20 }),
});
