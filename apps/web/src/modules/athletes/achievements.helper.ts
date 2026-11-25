import {
  type Achievement,
  type AchievementType,
  type AwardAchievement,
  COMPETITION_LEVEL_ORDER,
  type CompetitionAchievement,
  type CompetitionLevel,
  isCompetitionAchievement,
  MEDAL_ACHIEVEMENT_TYPES,
  WINNING_ACHIEVEMENT_TYPES,
} from '@was/shared';
import type { AchievementGroup } from './achievement-group.interface';
import type { TitleGroup } from './title-group.interface';

const levelRank = (l: CompetitionLevel) => COMPETITION_LEVEL_ORDER.indexOf(l);
/** Result types shown as titles/medals, in display order: champion, gold, title won, silver, bronze. */
const TITLE_TYPES: readonly AchievementType[] = [...new Set<AchievementType>([...WINNING_ACHIEVEMENT_TYPES, ...MEDAL_ACHIEVEMENT_TYPES])];

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

/** Titles and medals (champion · title won · gold · silver · bronze) by competition, each split by result type (T4.3). */
export const groupTitlesByCompetition = (achievements: readonly Achievement[]): TitleGroup[] =>
  groupByCompetition(achievements.filter(isCompetitionAchievement).filter((a) => TITLE_TYPES.includes(a.type))).map((g) => ({
    ...g,
    kinds: TITLE_TYPES.map((type) => ({ type, items: g.items.filter((i) => i.type === type) })).filter((k) => k.items.length > 0),
  }));

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
