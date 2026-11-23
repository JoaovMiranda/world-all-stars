import type { runBiography } from '../enrich/run-biography.service';

/** Outcome of one autonomous collection (first or update mode). */
export interface CollectReport {
  mode: 'first' | 'update';
  people: number;
  missing: string[];
  biography: Awaited<ReturnType<typeof runBiography>> | null;
  needsEnrichment: number;
  skippedUnchanged: number;
}
