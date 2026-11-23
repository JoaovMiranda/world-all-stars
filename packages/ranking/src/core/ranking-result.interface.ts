import type { RankedEntry } from './ranked-entry.interface';
import type { RankingDefinition } from './ranking-definition.interface';

export interface RankingResult {
  methodology: string;
  methodologyVersion: string;
  engineVersion: string;
  ranking: RankingDefinition;
  configHash: string;
  inputHash: string;
  outputHash: string;
  manifest: { id: string; version: number }[];
  entries: RankedEntry[];
}
