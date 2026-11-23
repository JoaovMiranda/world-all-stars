import type { RankingDefinition } from '../../core/ranking-definition.interface';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { BjjConfig } from './bjj-config.type';

/** BASE_POINTS(placement): points of the placement band that contains it (0 outside every band). */
export const basePoints = (placement: number, config: BjjConfig) => config.placementPoints.find((p) => placement >= p.min && placement <= p.max)?.points ?? 0;

/** A competitive result of the ranking's classification (gi/no-gi, gender, and belt when the ranking has one). */
export const bjjInScope = (e: RankingEvidence, r: RankingDefinition) =>
  e.kind === 'result' &&
  e.attributes.giMode === r.scope.giMode &&
  e.attributes.gender === r.scope.gender &&
  (r.scope.belt === null || e.attributes.belt === r.scope.belt);

/** Only verified, official results with a placement count. */
export const bjjCountedResult = (e: RankingEvidence) =>
  e.attributes.verification === 'verified' && e.attributes.status === 'official' && typeof e.attributes.placement === 'number';
