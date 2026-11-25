// Cross-sport band mappings (handoff §11.4, D07) as data with a source note each. The ruleset is versioned; a new
// mapping is a new row (or a new ruleset key), never a code change. Facts without a mapping stay unmapped.
import { and, eq, isNull, notInArray } from 'drizzle-orm';
import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import type { CrossSportMappingSeed as MappingSeed } from '../interfaces/cross-sport-mapping-seed.interface';
import * as T from '../schema';
import type { Database } from '../types/database.type';

/** Continental football championships of D06 (same slugs as the football-champions methodology). */
export const FOOTBALL_CONTINENTAL_SLUGS = [
  'copa-america',
  'uefa-euro',
  'africa-cup-of-nations',
  'afc-asian-cup',
  'concacaf-gold-cup',
  'ofc-nations-cup',
  'copa-america-femenina',
  'uefa-womens-euro',
  'womens-africa-cup-of-nations',
  'afc-womens-asian-cup',
  'concacaf-womens-championship',
  'ofc-womens-nations-cup',
];

/** Ruleset version written by this seed. */
export const CROSS_SPORT_SEED_RULESET = 'cross-sport@1';

/**
 * §11.4 seed mappings, reviewed in T2.6. Values are what the read model derives from a published grant: the
 * competition slug of a title (else issuer, else definition), `<competition>:<level>` for non-Olympic medals and
 * runner-up results, and `olympic-<level>` (sport `multi-sport`) for Olympic medals of every sport. Hall of fame,
 * Ballon d'Or and the GM title are legacy only (not competitive kinds), so they never need a row here.
 */
export const CROSS_SPORT_SEED_MAPPINGS: MappingSeed[] = [
  { sport: 'boxing', kind: 'recognition', value: 'undisputed', band: 'S', note: 'handoff §11.4: undisputed champion' },
  { sport: 'boxing', kind: 'recognition', value: 'wbc', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'wba', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'ibf', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'wbo', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'ibo', band: 'B', note: 'handoff §11.4: secondary world title' },
  { sport: 'football', kind: 'recognition', value: 'fifa-world-cup', band: 'S', note: 'handoff §11.4: World Cup title' },
  { sport: 'football', kind: 'recognition', value: 'fifa-womens-world-cup', band: 'S', note: 'handoff §11.4: World Cup title (women)' },
  // Continental championships (D06): one row per competition slug, the values the read model derives from grants.
  ...FOOTBALL_CONTINENTAL_SLUGS.map(
    (value): MappingSeed => ({ sport: 'football', kind: 'recognition', value, band: 'A', note: 'handoff §11.4: continental championship' }),
  ),
  { sport: 'football', kind: 'recognition', value: 'olympic-football', band: 'A', note: 'handoff §11.4: Olympic football gold ranks as continental' },
  {
    sport: 'football',
    kind: 'recognition',
    value: 'olympic-football-women',
    band: 'A',
    note: 'handoff §11.4: Olympic football gold ranks as continental (women)',
  },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-gold', band: 'S', note: 'handoff §11.4: Olympic gold' },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-silver', band: 'A', note: 'handoff §11.4: Olympic silver' },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-bronze', band: 'B', note: 'handoff §11.4: Olympic bronze' },
  { sport: 'jiu-jitsu', kind: 'recognition', value: 'adcc', band: 'S', note: 'handoff §11.4: ADCC champion' },
  { sport: 'jiu-jitsu', kind: 'recognition', value: 'ibjjf-world-championship', band: 'S', note: 'handoff §11.4: IBJJF Worlds champion' },
  { sport: 'jiu-jitsu', kind: 'recognition', value: 'pan', band: 'A', note: 'handoff §11.4: Pan champion' },
  { sport: 'chess', kind: 'recognition', value: 'world-chess-championship', band: 'S', note: 'handoff §11.4: classical world champion' },
  { sport: 'chess', kind: 'recognition', value: 'world-rapid-chess-championship', band: 'A', note: 'handoff §11.4: rapid world champion' },
  { sport: 'chess', kind: 'recognition', value: 'world-blitz-chess-championship', band: 'B', note: 'handoff §11.4: blitz world champion' },
  { sport: 'ironman', kind: 'recognition', value: 'ironman-world-championship', band: 'S', note: 'handoff §11.4: Ironman world champion' },
  ...['runner_up', 'silver', 'bronze'].map(
    (level): MappingSeed => ({
      sport: 'ironman',
      kind: 'result',
      value: `ironman-world-championship:${level}`,
      band: 'B',
      note: 'handoff §11.4: Ironman world championship podium',
    }),
  ),
];

/** Idempotent: deterministic ids on the natural key (ruleset + sport + kind + value). */
export const seedCrossSportMappings = async (db: Database): Promise<number> => {
  let count = 0;
  const ids: string[] = [];
  for (const mapping of CROSS_SPORT_SEED_MAPPINGS) {
    const id = seedId('cross_sport', CROSS_SPORT_SEED_RULESET, mapping.sport, mapping.kind, mapping.value);
    ids.push(id);
    await upsertRow(db, T.crossSportMappings, {
      id,
      createdVia: 'seed',
      rulesetKey: CROSS_SPORT_SEED_RULESET,
      sport: mapping.sport,
      kind: mapping.kind,
      value: mapping.value,
      band: mapping.band,
      fromYear: 0,
      sourceNote: mapping.note,
    });
    count++;
  }
  // Seed rows dropped from the list (values that never match a grant) are soft-deleted, so the ruleset hash and the
  // methodology page reflect only the live rows. Rows written by admins (createdVia ≠ seed) are never touched.
  await db
    .update(T.crossSportMappings)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(T.crossSportMappings.rulesetKey, CROSS_SPORT_SEED_RULESET),
        eq(T.crossSportMappings.createdVia, 'seed'),
        isNull(T.crossSportMappings.deletedAt),
        notInArray(T.crossSportMappings.id, ids),
      ),
    );
  return count;
};
