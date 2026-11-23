import type { z } from 'zod';

import type { ComputedEntry } from './computed-entry.interface';
import type { OutputKind } from './output-kind.type';
import type { RankingDefinition } from './ranking-definition.interface';
import type { RankingInput } from './ranking-input.interface';

export interface RankingMethodology<C> {
  key: string;
  version: string;
  sport: string | null;
  outputKind: OutputKind;
  configSchema: z.ZodType<C>;
  defaultConfig: C;
  rankings(config: C): RankingDefinition[];
  compute(ranking: RankingDefinition, input: RankingInput, config: C): ComputedEntry[];
}
