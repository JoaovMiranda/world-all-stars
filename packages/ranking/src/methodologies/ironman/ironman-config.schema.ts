import { z } from 'zod';

export const IronmanConfigSchema = z.object({
  worldChampionshipSlugs: z.array(z.string()).default(['ironman-world-championship']),
  titlePoints: z.number().default(10),
  podiumPoints: z.number().default(3),
  courseRecordPoints: z.number().default(5),
});
