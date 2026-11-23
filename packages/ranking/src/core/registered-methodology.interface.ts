import type { OutputKind } from './output-kind.type';
import type { RankingDefinition } from './ranking-definition.interface';
import type { RankingInput } from './ranking-input.interface';
import type { RankingResult } from './ranking-result.interface';

/** Type-erased view of a methodology, as stored in the registry (no `as unknown as` casts needed). */
export interface RegisteredMethodology {
  readonly key: string;
  readonly version: string;
  readonly sport: string | null;
  readonly outputKind: OutputKind;
  /** Parsed default config (schema defaults), e.g. to store a ruleset and hash it. */
  readonly defaultConfig: unknown;
  /** Rankings produced with the given raw config (default config when omitted). */
  rankingDefinitions(rawConfig?: unknown): RankingDefinition[];
  /** Runs one ranking through the engine (config validated by the methodology's schema). */
  calculate(rankingKey: string, input: RankingInput, rawConfig?: unknown): RankingResult;
}
