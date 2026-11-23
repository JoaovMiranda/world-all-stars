import type { OutputKind, RankingDefinition, RankingInput, RankingResult } from './engine';

/** Type-erased view of a methodology, as stored in the registry (no `as unknown as` casts needed). */
export interface RegisteredMethodology {
  readonly key: string;
  readonly version: string;
  readonly sport: string | null;
  readonly outputKind: OutputKind;
  /** Rankings produced with the given raw config (default config when omitted). */
  rankingDefinitions(rawConfig?: unknown): RankingDefinition[];
  /** Runs one ranking through the engine (config validated by the methodology's schema). */
  calculate(rankingKey: string, input: RankingInput, rawConfig?: unknown): RankingResult;
}
