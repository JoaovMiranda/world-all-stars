import type { BjjConfig } from './bjj-config.type';

/** BASE_POINTS(placement): points of the placement band that contains it (0 outside every band). */
export const basePoints = (placement: number, config: BjjConfig) => config.placementPoints.find((p) => placement >= p.min && placement <= p.max)?.points ?? 0;
