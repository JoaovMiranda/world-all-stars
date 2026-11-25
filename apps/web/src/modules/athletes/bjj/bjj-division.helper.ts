import { type AthleteProfile, type DivisionClass, isCompetitionAchievement } from '@was/shared';

import { BJJ_ABSOLUTE_PATTERN, BJJ_DIMENSION, BJJ_PLACEMENT_BY_TYPE } from './bjj-division.const';
import type { BjjResult } from './bjj-result.interface';
import type { BjjSummary } from './bjj-summary.interface';

const classOf = (classes: readonly DivisionClass[], dimension: string) => classes.find((c) => c.dimension === dimension) ?? null;

const uniqueByValue = (list: readonly (DivisionClass | null)[]): DivisionClass[] => {
  const seen = new Map<string, DivisionClass>();
  for (const c of list) if (c && !seen.has(c.value)) seen.set(c.value, c);
  return [...seen.values()];
};

/** A weight class that is the open (absolute) division. */
export const isAbsoluteDivision = (weight: DivisionClass | null): boolean =>
  !!weight && (BJJ_ABSOLUTE_PATTERN.test(weight.value) || BJJ_ABSOLUTE_PATTERN.test(weight.label));

/** Competition results of the profile with their BJJ classes, newest first. */
export const bjjResults = (profile: AthleteProfile): BjjResult[] =>
  profile.achievements
    .filter(isCompetitionAchievement)
    .map((a) => {
      const classes = a.classes ?? [];
      const weight = classOf(classes, BJJ_DIMENSION.weight);
      return {
        id: a.id,
        competition: a.competition.name,
        year: a.year,
        belt: classOf(classes, BJJ_DIMENSION.belt),
        gi: classOf(classes, BJJ_DIMENSION.gi),
        weight,
        sex: classOf(classes, BJJ_DIMENSION.sex),
        absolute: isAbsoluteDivision(weight),
        placement: a.rank ?? BJJ_PLACEMENT_BY_TYPE[a.type] ?? null,
      };
    })
    .sort((x, y) => y.year - x.year);

/** Belts, gi/no-gi split, weight classes (absolute apart), absolute count and podium placements of the results. */
export const bjjSummary = (results: readonly BjjResult[]): BjjSummary => {
  const gi = new Map<string, { mode: DivisionClass; count: number }>();
  for (const r of results) {
    if (!r.gi) continue;
    const g = gi.get(r.gi.value) ?? { mode: r.gi, count: 0 };
    g.count += 1;
    gi.set(r.gi.value, g);
  }
  const podium: [number, number, number] = [0, 0, 0];
  for (const r of results) if (r.placement === 1 || r.placement === 2 || r.placement === 3) podium[r.placement - 1] = (podium[r.placement - 1] ?? 0) + 1;
  return {
    belts: uniqueByValue(results.map((r) => r.belt)),
    gi: [...gi.values()],
    weights: uniqueByValue(results.filter((r) => !r.absolute).map((r) => r.weight)),
    absolute: results.filter((r) => r.absolute).length,
    podium,
  };
};
