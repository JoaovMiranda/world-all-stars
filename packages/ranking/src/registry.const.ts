import type { RankingMethodology } from './core/ranking-methodology.interface';
import { bjjCareer } from './methodologies/bjj-career/bjj-career.methodology';
import { footballChampions } from './methodologies/football-champions/football-champions.methodology';

/** Registered methodologies by key (adding a sport = adding a methodology, never touching the engine). */
export const METHODOLOGIES: Record<string, RankingMethodology<never>> = {
  [footballChampions.key]: footballChampions as unknown as RankingMethodology<never>,
  [bjjCareer.key]: bjjCareer as unknown as RankingMethodology<never>,
};
