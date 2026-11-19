// Universal ranking engine (handoff v3 §8, E01–E05): pure TypeScript, no database, no API, no UI.
// A methodology defines eligibility, comparison and presentation; the engine executes it deterministically and
// hashes inputs and outputs (same manifest + same ruleset ⇒ same output_hash). No universal formula: a methodology may
// output scores, ordinal positions, ratings or bands.
import { createHash } from 'node:crypto';

import type { z } from 'zod';

export const ENGINE_VERSION = '1.0.0';

export type OutputKind = 'score' | 'ordinal' | 'rating' | 'bands';
export type AttributeValue = string | number | boolean | null;

/** One piece of evidence (result, recognition grant, squad membership, title holding…) with its version. */
export interface RankingEvidence {
  id: string;
  version: number;
  kind: string;
  competitorId: string;
  attributes: Record<string, AttributeValue>;
}
export interface RankingCompetitor {
  id: string;
  name: string;
  kind: 'person' | 'team' | 'group';
}
export interface RankingInput {
  competitors: RankingCompetitor[];
  evidence: RankingEvidence[];
}

export interface ComputedEntry {
  competitorId: string;
  eligible: boolean;
  eligibilityReason: string | null;
  score: number | null;
  band: string | null;
  metrics: Record<string, number>;
  items: { evidenceId: string; contribution: number; note: string | null }[];
  /** Comparison key, most significant first: higher numbers rank first; ties share the position. */
  sortKey: number[];
}

export interface RankingDefinition {
  key: string;
  title: string;
  scope: Record<string, AttributeValue>;
}

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

export interface RankedEntry extends ComputedEntry {
  rank: number | null;
  rankTied: boolean;
}
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

export const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonicalJson((value as Record<string, unknown>)[k])}`).join(',')}}`;
  return JSON.stringify(value ?? null);
};
export const sha256 = (value: unknown) => createHash('sha256').update(typeof value === 'string' ? value : canonicalJson(value)).digest('hex');

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
  const inputHash = sha256({ manifest, evidence: [...input.evidence].sort((a, b) => a.id.localeCompare(b.id)), competitors: [...input.competitors].sort((a, b) => a.id.localeCompare(b.id)) });
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
  return { methodology: methodology.key, methodologyVersion: methodology.version, engineVersion: ENGINE_VERSION, ranking, configHash: sha256(config), inputHash, outputHash, manifest, entries };
};
