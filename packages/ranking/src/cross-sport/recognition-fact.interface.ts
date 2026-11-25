/**
 * One published recognition grant as the read model loads it (definition × grant). It is the shared input of the
 * cross-sport band (competitive kinds only) and of the legacy level (every kind).
 */
export interface RecognitionFact {
  /** Grant id: the evidence the band or legacy item points to. */
  evidenceId: string;
  version: number;
  competitorId: string;
  /** Sport slug of the definition (the real sport, also for Olympic medals). */
  sport: string | null;
  /** Recognition kind slug (championship_title, medal, award, hall_of_fame…). */
  recognitionKind: string;
  /** Recognition level slug (gold, silver, bronze, winner, runner_up) when the grant has one. */
  level: string | null;
  competition: string | null;
  /** The competition is (part of) the Olympic Games. */
  olympic: boolean;
  /** Competition level (world, continental, national, local) of the definition or its competition. */
  competitionLevel: string | null;
  issuer: string | null;
  definition: string;
  year: number | null;
}
