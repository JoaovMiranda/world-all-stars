import { ACHIEVEMENT_TYPE_VALUES } from '../enums/achievement-type.enum';
import type { HeadToHeadInput } from '../interfaces/head-to-head-input.interface';
import { AthleteSummarySchema } from '../schemas/athlete-summary.schema';
import type { HeadToHeadResponse, HeadToHeadSide } from '../types/head-to-head.type';
import { uniqueBy } from './collection.helper';

const sideOf = ({ profile, band, legacy }: HeadToHeadInput): HeadToHeadSide => ({
  athlete: AthleteSummarySchema.parse(profile),
  sports: uniqueBy([{ slug: profile.sport.slug, name: profile.sport.name }, ...band.items.map((i) => i.sport)], (s) => s.slug),
  band: { band: band.band, points: band.points, items: band.items, pendingReview: band.pendingReview },
  legacy: { level: legacy.level, score: legacy.score, accepted: legacy.accepted, dossierStatus: legacy.dossierStatus },
  titles: ACHIEVEMENT_TYPE_VALUES.flatMap((type) => {
    const count = profile.achievements.filter((x) => x.type === type).length;
    return count ? [{ type, count }] : [];
  }),
  sources: uniqueBy(profile.sourceLinks, (s) => s.url),
});

/**
 * Compare / head-to-head (D04): two competitors side by side. Methodology positions appear only for published
 * rankings of a sport both share (`snapshotSports`: snapshot id → sport slug); scores across sports are never set
 * against each other — the cross-sport band is the approximate comparison.
 */
export const composeHeadToHead = (a: HeadToHeadInput, b: HeadToHeadInput, snapshotSports: ReadonlyMap<string, string | null>): HeadToHeadResponse => {
  const left = sideOf(a);
  const right = sideOf(b);
  const sharedSports = left.sports.filter((s) => right.sports.some((r) => r.slug === s.slug));
  const shared = new Set(sharedSports.map((s) => s.slug));
  const position = (items: HeadToHeadInput['rankings'], snapshotId: string) => {
    const hit = items.find((i) => i.snapshotId === snapshotId);
    return hit ? { rank: hit.rank, rankTied: hit.rankTied, score: hit.score } : null;
  };
  const methodology = uniqueBy([...a.rankings, ...b.rankings], (r) => r.snapshotId).flatMap((r) => {
    const sport = snapshotSports.get(r.snapshotId);
    if (!sport || !shared.has(sport)) return [];
    return [
      {
        snapshotId: r.snapshotId,
        rankingKey: r.rankingKey ?? null,
        title: r.title,
        sport,
        a: position(a.rankings, r.snapshotId),
        b: position(b.rankings, r.snapshotId),
      },
    ];
  });
  return { a: left, b: right, sharedSports, methodology, bandRulesetVersion: a.band.rulesetVersion, legacyRulesetVersion: a.legacy.rulesetVersion };
};
