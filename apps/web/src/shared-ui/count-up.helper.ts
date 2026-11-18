/** Cinematic ease-out (fast start, long soft landing), matching --ease-cinematic closely enough for numbers. */
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - 2 ** (-10 * t));

/** Decimal places of the target, so 4.5 counts 0.0 → 4.5 and 1279 counts in whole numbers. */
export const decimalsOf = (n: number): number => {
  if (!Number.isFinite(n) || Number.isInteger(n)) return 0;
  return Math.min(3, String(n).split('.')[1]?.length ?? 0);
};

/** Value shown at progress `t` (0–1) when counting from 0 to `to`. Ends exactly on `to`. */
export function countAt(t: number, to: number): number {
  if (t >= 1) return to;
  const d = decimalsOf(to);
  const v = to * easeOutExpo(Math.max(0, t));
  const f = 10 ** d;
  return Math.round(v * f) / f;
}

/** Duration (ms) that grows with the size of the number: small counts are short, big ones a bit longer. */
export const countDuration = (to: number): number => Math.round(Math.min(1100, 600 + Math.log10(Math.abs(to) + 1) * 150));
