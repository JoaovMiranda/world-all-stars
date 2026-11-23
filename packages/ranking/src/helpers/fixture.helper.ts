// Offline fixtures (T2.2): JSON inputs under `packages/ranking/test-fixtures/<methodology>/` read by the golden tests.
// Real data replaces them in T5.11; the fixtures stay as the hand-computed examples of each METHODOLOGY.md.
import { readFileSync } from 'node:fs';

import type { RankingEvidence } from '../core/ranking-evidence.interface';
import type { RankingInput } from '../core/ranking-input.interface';

const FIXTURES_DIR = new URL('../../test-fixtures/', import.meta.url);

/** Reads `test-fixtures/<methodology>/<name>.json` as a ranking input (the `description` field is documentation). */
export const loadRankingFixture = (methodology: string, name: string): RankingInput => {
  const raw = JSON.parse(readFileSync(new URL(`${methodology}/${name}.json`, FIXTURES_DIR), 'utf8')) as RankingInput & { description?: string };
  return { competitors: raw.competitors, evidence: raw.evidence };
};

/** The evidence of one competitor of a fixture (the per-player hand-computed examples). */
export const evidenceOf = (input: RankingInput, competitorId: string): RankingEvidence[] => input.evidence.filter((e) => e.competitorId === competitorId);
