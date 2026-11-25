import { sha256 } from '../helpers/hash.helper';
import { CROSS_SPORT_COMPETITIVE_KINDS, CROSS_SPORT_OLYMPIC_SPORT, CROSS_SPORT_RULESET_VERSION } from './cross-sport.const';
import { calculateCrossSportBands, findCrossSportMapping } from './cross-sport.helper';
import type { CrossSportItem } from './cross-sport-item.interface';
import type { CrossSportMapping } from './cross-sport-mapping.interface';
import type { CrossSportRun } from './cross-sport-run.interface';
import type { RecognitionFact } from './recognition-fact.interface';
import { UnmappedRecognitionError } from './unmapped-recognition.error';

/** Code-point order: the same on every machine and locale (hash inputs must not depend on ICU collation). */
const byCodePoint = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/**
 * Candidate cross-sport items of a published grant, most specific first, or none when the kind is not a competitive
 * fact (awards, halls of fame, records and traditional honours are legacy only, §11.4). Titles try the competition
 * slug, then the issuing organization (a WBC belt of any division maps through the `wbc` row), then the definition;
 * medals and runner-up results use `<source>:<level>`; Olympic medals of every sport share the `multi-sport` rows
 * `olympic-gold|silver|bronze`.
 */
export const crossSportCandidatesOf = (fact: RecognitionFact): CrossSportItem[] => {
  if (!CROSS_SPORT_COMPETITIVE_KINDS.includes(fact.recognitionKind)) return [];
  const base = { competitorId: fact.competitorId, year: fact.year, evidenceId: fact.evidenceId };
  if (fact.recognitionKind === 'medal' && fact.olympic)
    return [{ ...base, sport: CROSS_SPORT_OLYMPIC_SPORT, kind: 'result', value: `olympic-${fact.level ?? 'unknown'}` }];
  const sources = [...new Set([fact.competition, fact.issuer, fact.definition].filter((v): v is string => !!v))];
  const sport = fact.sport ?? 'unknown';
  if (fact.recognitionKind === 'medal' || fact.recognitionKind === 'runner_up')
    return sources.map((source) => ({ ...base, sport, kind: 'result', value: `${source}:${fact.level ?? fact.recognitionKind}` }));
  return sources.map((source) => ({ ...base, sport, kind: 'recognition', value: source }));
};

/** The primary cross-sport item of a grant (its most specific candidate), or null for a legacy-only kind. */
export const crossSportItemOf = (fact: RecognitionFact): CrossSportItem | null => crossSportCandidatesOf(fact)[0] ?? null;

/** Hash of the mapping rows of each sport, independent of their storage order. */
export const crossSportRulesetHashes = (mappings: readonly CrossSportMapping[]): Record<string, string> => {
  const bySport = new Map<string, CrossSportMapping[]>();
  for (const m of mappings) bySport.set(m.sport, [...(bySport.get(m.sport) ?? []), m]);
  const key = (m: CrossSportMapping) => `${m.kind}|${m.value}|${m.fromYear ?? 0}|${m.toYear ?? ''}`;
  return Object.fromEntries(
    [...bySport.entries()]
      .sort(([a], [b]) => byCodePoint(a, b))
      .map(([sport, rows]) => [
        sport,
        sha256(
          [...rows]
            .sort((a, b) => byCodePoint(key(a), key(b)))
            .map((m) => ({ kind: m.kind, value: m.value, band: m.band, fromYear: m.fromYear ?? 0, toYear: m.toYear ?? null })),
        ),
      ]),
  );
};

/**
 * Runs the cross-sport ruleset over published facts. Non-competitive facts are skipped; competitive facts without a
 * mapping become `UnmappedRecognitionError`s (review list) and never contribute a guessed band. Hashes are built from
 * the sorted canonical input and output only (no ids generated at run time, no clock), so a re-run with the same data
 * and mappings yields the same `outputHash`.
 */
export const runCrossSport = (facts: readonly RecognitionFact[], mappings: readonly CrossSportMapping[]): CrossSportRun => {
  const mapped: CrossSportItem[] = [];
  const unmapped: UnmappedRecognitionError[] = [];
  const sorted = [...facts].sort((a, b) => byCodePoint(a.evidenceId, b.evidenceId));
  for (const fact of sorted) {
    const candidates = crossSportCandidatesOf(fact);
    if (!candidates.length) continue;
    const match = candidates.find((c) => findCrossSportMapping(c, mappings));
    if (match) mapped.push(match);
    else unmapped.push(new UnmappedRecognitionError(candidates[0]!));
  }
  const items = [...mapped, ...unmapped.map((u) => u.item)].sort((a, b) => byCodePoint(a.evidenceId, b.evidenceId));
  const rulesetHashes = crossSportRulesetHashes(mappings);
  const entries = calculateCrossSportBands(mapped, mappings);
  const inputHash = sha256({ ruleset: CROSS_SPORT_RULESET_VERSION, rulesetHashes, items });
  const outputHash = sha256({
    ruleset: CROSS_SPORT_RULESET_VERSION,
    entries: entries.map((e) => ({
      competitorId: e.competitorId,
      band: e.band,
      points: e.points,
      items: e.items.map((i) => [i.evidenceId, i.band, i.points]),
    })),
    unmapped: unmapped.map((u) => u.item.evidenceId),
  });
  return { rulesetVersion: CROSS_SPORT_RULESET_VERSION, rulesetHashes, inputHash, outputHash, entries, unmapped };
};
