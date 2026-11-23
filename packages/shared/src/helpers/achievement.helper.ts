import { WINNING_ACHIEVEMENT_TYPES } from '../consts/achievement.const';
import { AchievementKind } from '../enums/achievement-kind.enum';
import type { CompetitionLevel } from '../enums/competition-level.enum';
import type { AwardAchievement, CompetitionAchievement } from '../types/achievement.type';
import type { Achievement } from '../types/athlete-profile.type';

const WINNING = new Set<string>(WINNING_ACHIEVEMENT_TYPES);

export const isCompetitionAchievement = (a: Achievement): a is CompetitionAchievement => a.kind === AchievementKind.Competition;
export const isAwardAchievement = (a: Achievement): a is AwardAchievement => a.kind === AchievementKind.Award;
/** A competition result that counts as a title (champion · gold · title won). */
export const isCompetitionWin = (a: Achievement): a is CompetitionAchievement => isCompetitionAchievement(a) && WINNING.has(a.type);

/** Titles won, optionally of one competition (e.g. `copa-do-mundo-fifa`). */
export const competitionWins = (achievements: readonly Achievement[], competitionSlug?: string): CompetitionAchievement[] =>
  achievements.filter(isCompetitionWin).filter((a) => !competitionSlug || a.competition.slug === competitionSlug);

/** First and last year of titles at the given levels (longevity at the top, doc 16), or null without titles. */
export const winYearSpan = (achievements: readonly Achievement[], levels: readonly CompetitionLevel[]): [number, number] | null => {
  const years = competitionWins(achievements)
    .filter((a) => levels.includes(a.level))
    .map((a) => a.year);
  return years.length ? [Math.min(...years), Math.max(...years)] : null;
};

/** Years both careers overlap (0 when they never crossed). `now` closes careers still running. */
export const careerOverlapYears = (
  a: { careerFrom: number | null; careerTo: number | null },
  b: { careerFrom: number | null; careerTo: number | null },
  now: number,
): number => {
  if (a.careerFrom === null || b.careerFrom === null) return 0;
  return Math.max(0, Math.min(a.careerTo ?? now, b.careerTo ?? now) - Math.max(a.careerFrom, b.careerFrom) + 1);
};
