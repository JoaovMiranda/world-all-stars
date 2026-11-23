/** The existing person of a labelled identity pair. */
export interface IdentitySampleCandidate {
  names: string[];
  externalIds: Record<string, string>;
  sports: string[];
  birthDate: string | null;
}
