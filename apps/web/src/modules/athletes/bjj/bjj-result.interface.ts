import type { DivisionClass } from '@was/shared';

/** One BJJ competition result with its division classes (belt, gi/no-gi, weight, absolute) and placement. */
export interface BjjResult {
  id: string;
  competition: string;
  year: number;
  belt: DivisionClass | null;
  gi: DivisionClass | null;
  weight: DivisionClass | null;
  sex: DivisionClass | null;
  absolute: boolean;
  /** 1 = gold, 2 = silver, 3 = bronze; null when unknown. */
  placement: number | null;
}
