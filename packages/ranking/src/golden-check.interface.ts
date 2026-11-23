/** Result of the reproducibility gate of one methodology (T2.3). */
export interface GoldenCheck {
  ok: boolean;
  rankingKey: string;
  expected: string;
  actual: string | null;
}
