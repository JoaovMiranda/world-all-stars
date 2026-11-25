import type { RankingEvidence } from '../core/ranking-evidence.interface';
import type { RecognitionFact } from '../cross-sport/recognition-fact.interface';
import { LEGACY_AWARD_KINDS, LEGACY_TITLE_BY_LEVEL, LEGACY_TITLE_KINDS } from './legacy.const';
import type { LegacyInput } from './legacy-input.interface';

/** Legacy honor key of a grant: titles by competition level, awards, halls of fame; anything else stays as its kind. */
export const legacyHonorOf = (fact: RecognitionFact): string => {
  if (fact.recognitionKind === 'hall_of_fame') return 'hall_of_fame';
  if (fact.recognitionKind === 'record') return 'record';
  if (LEGACY_AWARD_KINDS.includes(fact.recognitionKind)) return 'award';
  const wins = fact.recognitionKind !== 'medal' || fact.level === 'gold' || fact.level === 'winner';
  if (LEGACY_TITLE_KINDS.includes(fact.recognitionKind) && wins)
    return LEGACY_TITLE_BY_LEVEL[fact.competitionLevel ?? ''] ?? `${fact.recognitionKind}:${fact.competitionLevel ?? 'unknown'}`;
  return fact.level ? `${fact.recognitionKind}:${fact.level}` : fact.recognitionKind;
};

/**
 * Evidence of `computeLegacyLevel` for one competitor: its grants (every kind), ratified records, career span and
 * dossier. It reads the same published facts as the cross-sport band but never writes to it: the two readouts are
 * independent (D11).
 */
export const legacyEvidenceOf = (facts: readonly RecognitionFact[], input: LegacyInput): RankingEvidence[] => {
  const competitorId = facts[0]?.competitorId ?? 'competitor';
  const evidence: RankingEvidence[] = facts.map((f) => ({
    id: f.evidenceId,
    version: f.version,
    kind: 'recognition',
    competitorId: f.competitorId,
    attributes: { recognition: legacyHonorOf(f), year: f.year },
  }));
  for (const r of input.records)
    evidence.push({
      id: r.evidenceId,
      version: 1,
      kind: 'record',
      competitorId,
      attributes: { year: r.year, verification: r.ratified ? 'verified' : 'provisional' },
    });
  if (input.career) evidence.push({ id: `${competitorId}:career`, version: 1, kind: 'career', competitorId, attributes: { ...input.career } });
  if (input.dossierStatus)
    evidence.push({ id: `${competitorId}:dossier`, version: 1, kind: 'dossier', competitorId, attributes: { status: input.dossierStatus } });
  return evidence;
};
