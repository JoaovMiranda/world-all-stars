import { z } from 'zod';

export const ChessConfigSchema = z.object({
  classicalTitlePoints: z.number().default(10),
  rapidTitlePoints: z.number().default(4),
  blitzTitlePoints: z.number().default(2),
  ratingBase: z.number().default(2700),
  ratingDivisor: z.number().positive().default(10),
  numberOneYearPoints: z.number().default(1),
  formats: z.array(z.string()).default([]),
});
