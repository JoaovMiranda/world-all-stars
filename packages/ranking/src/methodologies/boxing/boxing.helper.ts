import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { BoxingConfig } from './boxing-config.type';
import { boxingDesignation } from './boxing.const';

/** A counted title win: the organization must have a positive weight in the ruleset. */
export const boxingTitlePoints = (e: RankingEvidence, config: BoxingConfig) =>
  e.kind === 'boxing_title' ? (config.organizationPoints[String(e.attributes.organization)] ?? 0) : 0;

/** Distinct divisions where the boxer won a counted title. */
export const boxingDivisions = (list: RankingEvidence[], config: BoxingConfig) => [
  ...new Set(list.filter((e) => boxingTitlePoints(e, config) > 0).map((e) => String(e.attributes.division))),
];

/**
 * `computeBoxingScore()`: whole career total, its breakdown and the designation. Weights come from the versioned
 * config; every counted evidence contributes exactly once and `items` explains the score.
 */
export const computeBoxingScore = (list: RankingEvidence[], config: BoxingConfig) => {
  const items: { evidenceId: string; contribution: number; note: string | null }[] = [];
  const titleByDivision = new Map<string, string>();
  let titles = 0;
  let undisputed = 0;
  let defenses = 0;
  let olympicGold = 0;
  const undisputedDivisions = new Set<string>();
  for (const e of list) {
    const points = boxingTitlePoints(e, config);
    if (points > 0) {
      titles++;
      const division = String(e.attributes.division);
      if (!titleByDivision.has(division)) titleByDivision.set(division, e.id);
      items.push({ evidenceId: e.id, contribution: points, note: `${e.attributes.organization} ${division} ${e.attributes.year}` });
      if (e.attributes.undisputed === true && !undisputedDivisions.has(division)) {
        undisputedDivisions.add(division);
        undisputed += config.undisputedPoints;
        items.push({ evidenceId: e.id, contribution: config.undisputedPoints, note: `undisputed ${division}` });
      }
    }
    if (e.kind === 'title_defense') {
      defenses++;
      items.push({ evidenceId: e.id, contribution: config.defensePoints, note: `defense ${e.attributes.division} ${e.attributes.year}` });
    }
    if (e.kind === 'olympic_medal') {
      const medal = String(e.attributes.medal);
      const value = config.olympicPoints[medal] ?? 0;
      if (medal === 'gold') olympicGold++;
      if (value > 0) items.push({ evidenceId: e.id, contribution: value, note: `Olympic ${medal} ${e.attributes.year}` });
    }
    if (e.kind === 'recognition' && e.attributes.recognition === 'hall_of_fame') {
      items.push({ evidenceId: e.id, contribution: config.hallOfFamePoints, note: 'Hall of Fame' });
    }
  }
  const career = list.find((e) => e.kind === 'career');
  const years = career ? Math.max(Number(career.attributes.toYear ?? 0) - Number(career.attributes.fromYear ?? 0), 0) : 0;
  const longevity = Math.min(Math.max(years - config.longevityStartYear, 0), config.longevityCap);
  if (longevity > 0 && career) items.push({ evidenceId: career.id, contribution: longevity, note: `${years} career years` });
  for (const [division, evidenceId] of titleByDivision) {
    items.push({ evidenceId, contribution: config.divisionPoints, note: `champion in ${division}` });
  }
  const score = items.reduce((sum, item) => sum + item.contribution, 0);
  return {
    score,
    designation: boxingDesignation(score, config),
    items,
    metrics: {
      titles,
      undisputed,
      defenses,
      divisions: titleByDivision.size,
      olympicGold,
      longevityYears: years,
      hallOfFame: list.some((e) => e.kind === 'recognition' && e.attributes.recognition === 'hall_of_fame') ? 1 : 0,
    },
  };
};
