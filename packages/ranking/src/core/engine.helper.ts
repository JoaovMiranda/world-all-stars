// Universal ranking engine (handoff v3 §8, E01–E05): pure TypeScript, no database, no API, no UI.
// A methodology defines eligibility, comparison and presentation; the engine executes it deterministically and
// hashes inputs and outputs (same manifest + same ruleset ⇒ same output_hash). No universal formula: a methodology may
// output scores, ordinal positions, ratings or bands.
import { sha256 } from '../helpers/hash.helper';
import { ENGINE_VERSION } from './engine-version.const';
import type { RankedEntry } from './ranked-entry.interface';
import type { RankingInput } from './ranking-input.interface';
import type { RankingMethodology } from './ranking-methodology.interface';
import type { RankingResult } from './ranking-result.interface';

const compareKeys = (a: number[], b: number[]) => {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (b[i] ?? 0) - (a[i] ?? 0);
    if (d !== 0) return d;
  }
  return 0;
};

/** Executes one ranking of a methodology. Ineligible entries are kept (with the reason) but get no position. */
export const runRanking = <C>(methodology: RankingMethodology<C>, rankingKey: string, input: RankingInput, rawConfig?: unknown): RankingResult => {
  const config = methodology.configSchema.parse(rawConfig ?? methodology.defaultConfig);
  const ranking = methodology.rankings(config).find((r) => r.key === rankingKey);
  if (!ranking) throw new Error(`${methodology.key} has no ranking ${rankingKey}`);
  const manifest = [...input.evidence].map((e) => ({ id: e.id, version: e.version })).sort((a, b) => a.id.localeCompare(b.id));
  const inputHash = sha256({
    manifest,
    evidence: [...input.evidence].sort((a, b) => a.id.localeCompare(b.id)),
    competitors: [...input.competitors].sort((a, b) => a.id.localeCompare(b.id)),
  });
  const computed = methodology.compute(ranking, input, config);
  const eligible = computed.filter((e) => e.eligible).sort((a, b) => compareKeys(a.sortKey, b.sortKey) || a.competitorId.localeCompare(b.competitorId));
  const entries: RankedEntry[] = [];
  eligible.forEach((e, i) => {
    const prev = entries[i - 1];
    const tied = !!prev && compareKeys(prev.sortKey, e.sortKey) === 0;
    const rank = tied ? prev!.rank : i + 1;
    if (tied) prev!.rankTied = true;
    entries.push({ ...e, rank, rankTied: tied });
  });
  for (const e of computed.filter((x) => !x.eligible)) entries.push({ ...e, rank: null, rankTied: false });
  const outputHash = sha256(entries.map((e) => ({ c: e.competitorId, r: e.rank, t: e.rankTied, s: e.score, b: e.band, m: e.metrics, el: e.eligible })));
  return {
    methodology: methodology.key,
    methodologyVersion: methodology.version,
    engineVersion: ENGINE_VERSION,
    ranking,
    configHash: sha256(config),
    inputHash,
    outputHash,
    manifest,
    entries,
  };
};
