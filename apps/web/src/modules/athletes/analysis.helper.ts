import { type AthleteProfile, COMPETITION_LEVEL_ORDER, CompetitionLevel, competitionWins, winYearSpan } from '@was/shared';

import { COMPARE_SERIES_TOKENS } from './athletes.const';
import type { CellValue } from './cell-value.type';

/** Color token of the i-th athlete of the comparison (main athlete = 0). */
export const seriesToken = (i: number): string => COMPARE_SERIES_TOKENS[i % COMPARE_SERIES_TOKENS.length] ?? '--primary';

const asNumber = (v: CellValue): number | null => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number.parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
};

/** Which cells hold the best value (needs 2+ distinct numbers; `higher` null = not ranked). */
export const bestFlags = (values: readonly CellValue[], higher: boolean | null): boolean[] => {
  const nums = values.map(asNumber);
  const present = nums.filter((n): n is number => n !== null);
  if (higher === null || present.length < 2 || new Set(present).size < 2) return values.map(() => false);
  const best = higher ? Math.max(...present) : Math.min(...present);
  return nums.map((n) => n === best);
};

/** Cumulative titles by age: [[age, n], …] (step chart). */
export const titlesByAge = (p: AthleteProfile): [number, number][] => {
  const born = p.birth.date ? Number(p.birth.date.slice(0, 4)) : null;
  if (born === null) return [];
  return competitionWins(p.achievements)
    .map((a) => a.year - born)
    .sort((a, b) => a - b)
    .map((age, i) => [age, i + 1]);
};

/** Titles per level, in the given level order. */
export const titlesPerLevel = (p: AthleteProfile, levels: readonly CompetitionLevel[] = COMPETITION_LEVEL_ORDER): number[] => {
  const wins = competitionWins(p.achievements);
  return levels.map((l) => wins.filter((a) => a.level === l).length);
};

/** Years between first and last world/continental title (doc 16 "longevity at the top"). */
export const topLongevity = (p: AthleteProfile): number | null => {
  const span = winYearSpan(p.achievements, [CompetitionLevel.World, CompetitionLevel.Continental]);
  return span ? span[1] - span[0] + 1 : null;
};

/** Titles won per competition for each athlete of a same-sport group, world level first. */
export const commonCompetitions = (group: readonly AthleteProfile[]) => {
  const map = new Map<string, { slug: string; name: string; level: CompetitionLevel; counts: number[] }>();
  group.forEach((p, i) =>
    competitionWins(p.achievements).forEach((w) => {
      const row = map.get(w.competition.slug) ?? { slug: w.competition.slug, name: w.competition.name, level: w.level, counts: group.map(() => 0) };
      row.counts[i] = (row.counts[i] ?? 0) + 1;
      map.set(w.competition.slug, row);
    }),
  );
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return [...map.values()].sort((a, b) => COMPETITION_LEVEL_ORDER.indexOf(a.level) - COMPETITION_LEVEL_ORDER.indexOf(b.level) || sum(b.counts) - sum(a.counts));
};

/** Club/team names (national teams excluded) shared by two athletes. */
export const sharedClubs = (a: AthleteProfile, b: AthleteProfile, nationalKind: string): string[] => {
  const clubs = (p: AthleteProfile) => new Set(p.teams.filter((t) => t.kind !== nationalKind).map((t) => t.name));
  const mine = clubs(a);
  return [...clubs(b)].filter((n) => mine.has(n));
};
