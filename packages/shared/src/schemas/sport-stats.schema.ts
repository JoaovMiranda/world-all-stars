import { z } from 'zod';

import { IsoDateSchema } from './iso-date.schema';

// Narrowed shapes of athlete_stats.stats (JSONB) for the sports that have a dedicated profile panel.
// The profile keeps the loose AthleteStatsSchema; panels `safeParse` these and fall back to the generic panel.
const count = z.number().int().nonnegative();
const optionalCount = count.nullable().optional();
const medals = z.object({ gold: count, silver: count, bronze: count });

export const FootballStatsSchema = z.object({
  schema: z.literal('football'),
  career_goals: optionalCount,
  career_matches: optionalCount,
  career_goals_note: z.string().nullable().optional(),
  national_team: z.object({ matches: count, goals: count, wins: optionalCount, draws: optionalCount, losses: optionalCount, as_of: IsoDateSchema.nullable().optional() }),
  world_cups: z.array(z.object({ year: z.number().int(), matches: count, goals: count, result: z.string(), note: z.string().nullable().optional() })),
});
export type FootballStats = z.infer<typeof FootballStatsSchema>;

export const SwimmingStatsSchema = z.object({
  schema: z.literal('swimming'),
  olympic_medals: medals,
  world_championship_medals: medals,
  world_records: z.object({ total: count, individual: count, relay: count }),
  olympic_games: z.array(z.number().int()).min(1),
});
export type SwimmingStats = z.infer<typeof SwimmingStatsSchema>;

export const BoxingStatsSchema = z.object({
  schema: z.literal('boxing'),
  record: z.object({ fights: count, wins: count, wins_ko: count, losses: count, draws: count, no_contests: count }),
  reach_cm: z.number().nullable().optional(),
  stance: z.string().nullable().optional(),
  pro_debut: IsoDateSchema.nullable().optional(),
  last_fight: IsoDateSchema.nullable().optional(),
});
export type BoxingStats = z.infer<typeof BoxingStatsSchema>;

export const CsStatsSchema = z.object({
  schema: z.literal('cs'),
  roles: z.array(z.string()),
  games: z.array(z.string()),
  majors_won: count.optional(),
  hltv_top20: z.array(z.object({ year: z.number().int(), rank: z.number().int().positive() })),
});
export type CsStats = z.infer<typeof CsStatsSchema>;
