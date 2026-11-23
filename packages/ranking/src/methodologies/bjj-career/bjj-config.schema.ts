import { z } from 'zod';

export const BjjConfigSchema = z.object({
  placementPoints: z.array(z.object({ min: z.number().int(), max: z.number().int(), points: z.number() })).default([
    { min: 1, max: 1, points: 100 },
    { min: 2, max: 2, points: 60 },
    { min: 3, max: 3, points: 35 },
    { min: 4, max: 4, points: 20 },
    { min: 5, max: 8, points: 10 },
    { min: 9, max: 16, points: 5 },
  ]),
  multipliers: z.record(z.string(), z.number()).default({ world: 10, international: 8, continental: 6, national: 4, grand_slam: 3, open: 2, regional: 1 }),
});
