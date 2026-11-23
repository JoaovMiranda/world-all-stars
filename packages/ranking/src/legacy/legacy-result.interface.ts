import type { LegacyHonor } from './legacy-honor.interface';
import type { LegacyLevel } from './legacy-level.type';

/** Legacy readout of one competitor. */
export interface LegacyResult {
  level: LegacyLevel;
  score: number;
  accepted: LegacyHonor[];
  excluded: { evidenceId: string; reason: string }[];
  explanation: string;
  rulesetVersion: string;
}
