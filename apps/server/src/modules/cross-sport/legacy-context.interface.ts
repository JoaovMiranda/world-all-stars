/** Everything besides the grants that the legacy readout of one athlete reads. */
export interface LegacyContext {
  careerStartYear: number | null;
  careerEndYear: number | null;
  dossierStatus: string | null;
  records: { evidenceId: string; year: number | null; ratified: boolean; label: string }[];
}
