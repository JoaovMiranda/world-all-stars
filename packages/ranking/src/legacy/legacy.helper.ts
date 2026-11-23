import type { RankingEvidence } from '../core/ranking-evidence.interface';
import type { LegacyHonor } from './legacy-honor.interface';
import type { LegacyLevel } from './legacy-level.type';
import type { LegacyResult } from './legacy-result.interface';
import { LEGACY_HONOR_POINTS, LEGACY_LEVELS, LEGACY_RULESET_VERSION, LEGACY_THRESHOLDS } from './legacy.const';

/**
 * Legacy L1–L5 (D11): computed from recognitions, honors, records and longevity. An approved Hall dossier is the only
 * way to reach L5; legacy is a separate readout and never changes a ranking score or a cross-sport band.
 */
export const computeLegacyLevel = (list: RankingEvidence[]): LegacyResult => {
  const accepted: LegacyHonor[] = [];
  const excluded: { evidenceId: string; reason: string }[] = [];
  for (const e of list) {
    if (e.kind !== 'recognition' && e.kind !== 'record') continue;
    const points = LEGACY_HONOR_POINTS[String(e.attributes.recognition ?? e.kind)] ?? 0;
    const verified = e.attributes.verification === undefined || e.attributes.verification === 'verified';
    if (!points || !verified) {
      excluded.push({ evidenceId: e.id, reason: points ? 'not verified' : 'not a legacy honor' });
      continue;
    }
    accepted.push({
      evidenceId: e.id,
      kind: String(e.attributes.recognition ?? e.kind),
      points,
      year: e.attributes.year != null ? Number(e.attributes.year) : null,
      note: e.attributes.note != null ? String(e.attributes.note) : null,
    });
  }
  const career = list.find((e) => e.kind === 'career');
  const years = career ? Math.max(Number(career.attributes.toYear ?? 0) - Number(career.attributes.fromYear ?? 0), 0) : 0;
  const longevity = Math.min(Math.max(years - 10, 0), 10);
  const score = accepted.reduce((sum, honor) => sum + honor.points, 0) + longevity;
  const dossier = list.find((e) => e.kind === 'dossier');
  const approvedDossier = dossier?.attributes.status === 'approved';
  const computed = [...LEGACY_LEVELS]
    .filter((level) => level !== 'L5')
    .reverse()
    .find((level) => score >= LEGACY_THRESHOLDS[level]);
  const level: LegacyLevel = approvedDossier && score >= LEGACY_THRESHOLDS.L5 ? 'L5' : (computed ?? 'L0');
  const explanation =
    level === 'L5'
      ? 'Approved Hall dossier and score above the L5 threshold'
      : approvedDossier
        ? `Approved Hall dossier, score ${score} below the L5 threshold (${LEGACY_THRESHOLDS.L5})`
        : score >= LEGACY_THRESHOLDS.L5
          ? 'Score alone never reaches L5: an approved Hall dossier is required'
          : `Score ${score} from ${accepted.length} accepted honors and ${longevity} longevity points`;
  return { level, score, accepted: accepted.sort((a, b) => b.points - a.points), excluded, explanation, rulesetVersion: LEGACY_RULESET_VERSION };
};
