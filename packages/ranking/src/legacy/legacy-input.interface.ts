/** Context of a competitor's legacy readout besides its recognition grants. */
export interface LegacyInput {
  /** Career span (longevity points); null when unknown. */
  career: { fromYear: number; toYear: number } | null;
  /** Status of the competitor's Hall of Greats dossier (`approved` is the only L5 gate), null without one. */
  dossierStatus: string | null;
  /** Ratified record marks (evidence id + year). */
  records: { evidenceId: string; year: number | null; ratified: boolean }[];
}
