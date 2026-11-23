import { COMPETITION_LEVEL_ORDER, COMPETITION_LEVEL_WEIGHT, TIER_ORDER, TIER_PERCENTILE_THRESHOLD, Tier } from '@was/shared';
import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import { championTiers, competitionLevels } from '../tables/config.table';
import type { Database } from '../types/database.type';

/**
 * Configuration enums that exist even without the prototype (doc 03: "enums are configuration, not data"):
 * competition levels and champion tiers, straight from the shared consts.
 */
export const seedConfig = async (db: Database): Promise<number> => {
  for (const [i, slug] of COMPETITION_LEVEL_ORDER.entries()) {
    await upsertRow(db, competitionLevels, {
      id: seedId('competition_levels', slug),
      createdVia: 'seed',
      slug,
      weight: COMPETITION_LEVEL_WEIGHT[slug],
      sortOrder: i,
    });
  }
  const minPercentile: Partial<Record<Tier, number>> = TIER_PERCENTILE_THRESHOLD;
  for (const [i, slug] of [...TIER_ORDER].reverse().entries()) {
    await upsertRow(db, championTiers, {
      id: seedId('champion_tiers', slug),
      createdVia: 'seed',
      slug,
      sortOrder: i,
      minPercentile: minPercentile[slug] ?? null,
      requiresDossier: slug === Tier.Mythic,
    });
  }
  return COMPETITION_LEVEL_ORDER.length + TIER_ORDER.length;
};
