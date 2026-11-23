import { type Achievement, type AwardAchievement, COMPETITION_LEVEL_ORDER, type CompetitionAchievement, type CompetitionLevel } from '@was/shared';
import type { AchievementGroup } from './achievement-group.interface';

const levelRank = (l: CompetitionLevel) => COMPETITION_LEVEL_ORDER.indexOf(l);

const groupBy = <A extends Achievement>(items: readonly A[], key: (a: A) => string, name: (a: A) => string): AchievementGroup<A>[] => {
  const map = new Map<string, AchievementGroup<A>>();
  for (const a of items) {
    const k = key(a);
    const g = map.get(k) ?? { key: k, name: name(a), level: a.level, items: [] };
    g.items.push(a);
    map.set(k, g);
  }
  return [...map.values()].map((g) => ({ ...g, items: [...g.items].sort((x, y) => x.year - y.year) }));
};

/** Titles grouped by competition, world level first. */
export const groupByCompetition = (wins: readonly CompetitionAchievement[]) =>
  groupBy(
    wins,
    (a) => a.competition.slug,
    (a) => a.competition.name,
  ).sort((a, b) => levelRank(a.level) - levelRank(b.level) || b.items.length - a.items.length);

/** Awards grouped by award, world level first. */
export const groupByAward = (awards: readonly AwardAchievement[]) =>
  groupBy(
    awards,
    (a) => a.award.slug,
    (a) => a.award.name,
  ).sort((a, b) => levelRank(a.level) - levelRank(b.level));

/** Every year from `from` to `to` (inclusive). */
export const yearsBetween = (from: number, to: number): number[] => Array.from({ length: Math.max(to - from + 1, 0) }, (_, i) => from + i);

/** Items of a group bucketed by year (for "2008 ×8"). */
export const byYear = <A extends Achievement>(items: readonly A[]): [number, A[]][] => {
  const map = new Map<number, A[]>();
  items.forEach((a) => map.set(a.year, [...(map.get(a.year) ?? []), a]));
  return [...map];
};
