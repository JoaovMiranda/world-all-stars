import type { CrossSportEntry } from './cross-sport-item.interface';
import type { UnmappedRecognitionError } from './unmapped-recognition.error';

/** One reproducible cross-sport calculation: same mappings + same facts → same hashes. */
export interface CrossSportRun {
  rulesetVersion: string;
  /** Hash of the mapping rows of each sport (the versioned ruleset per sport mapping, D07). */
  rulesetHashes: Record<string, string>;
  inputHash: string;
  outputHash: string;
  entries: CrossSportEntry[];
  /** Competitive facts without a mapping: typed errors for the admin review list, never a silent zero. */
  unmapped: UnmappedRecognitionError[];
}
