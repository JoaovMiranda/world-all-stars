/** Options of one Biography Enricher run. */
export interface BiographyRunOptions {
  /**
   * Independent candidates per athlete (1–3, first that passes wins). Default 1, or `BIOGRAPHY_CANDIDATES` from the
   * environment — meant for pilots only; candidates after the first sample with temperature 0.7 and another seed.
   */
  candidates?: number;
}
