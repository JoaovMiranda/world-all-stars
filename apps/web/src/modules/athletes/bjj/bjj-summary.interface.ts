import type { DivisionClass } from '@was/shared';

/** Classes an athlete competed in: belts, gi/no-gi split, weight classes, absolute count and podium placements. */
export interface BjjSummary {
  belts: DivisionClass[];
  gi: { mode: DivisionClass; count: number }[];
  weights: DivisionClass[];
  absolute: number;
  /** Results per podium placement (index 0 = 1st). */
  podium: [number, number, number];
}
