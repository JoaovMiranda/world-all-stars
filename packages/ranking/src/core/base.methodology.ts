import type { z } from 'zod';

import type { ComputedEntry } from './computed-entry.interface';
import { runRanking } from './engine.helper';
import type { OutputKind } from './output-kind.type';
import type { RankingDefinition } from './ranking-definition.interface';
import type { RankingInput } from './ranking-input.interface';
import type { RankingMethodology } from './ranking-methodology.interface';
import type { RankingResult } from './ranking-result.interface';
import type { RegisteredMethodology } from './registered-methodology.interface';

/**
 * Base of every ranking methodology (one sport family, versioned, documented in METHODOLOGY.md next to it). Subclasses
 * declare identity, config schema, the rankings they produce and `compute()`; the engine does ordering, ties and
 * hashing. `calculate()` is the type-erased entry the registry and services use.
 */
export abstract class BaseMethodology<Config> implements RankingMethodology<Config>, RegisteredMethodology {
  abstract readonly key: string;
  abstract readonly version: string;
  abstract readonly sport: string | null;
  abstract readonly outputKind: OutputKind;
  abstract readonly configSchema: z.ZodType<Config>;

  /** Config used when none is given: the schema's defaults. */
  get defaultConfig(): Config {
    return this.configSchema.parse({});
  }

  abstract rankings(config: Config): RankingDefinition[];
  abstract compute(ranking: RankingDefinition, input: RankingInput, config: Config): ComputedEntry[];

  /** Validates a raw config (falls back to the defaults). */
  parseConfig(rawConfig?: unknown): Config {
    return this.configSchema.parse(rawConfig ?? {});
  }

  rankingDefinitions(rawConfig?: unknown): RankingDefinition[] {
    return this.rankings(this.parseConfig(rawConfig));
  }

  calculate(rankingKey: string, input: RankingInput, rawConfig?: unknown): RankingResult {
    return runRanking(this, rankingKey, input, rawConfig);
  }
}
