/** An honor accepted into the legacy score. */
export interface LegacyHonor {
  evidenceId: string;
  kind: string;
  points: number;
  year: number | null;
  note: string | null;
}
