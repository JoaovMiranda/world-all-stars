// Cross-sport band mappings (handoff §11.4, D07) as data with a source note each. The ruleset is versioned; a new
// mapping is a new row (or a new ruleset key), never a code change. Facts without a mapping stay unmapped.
import type { Database } from '../types/database.type';
import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import * as T from '../schema';

/** Ruleset version written by this seed. */
export const CROSS_SPORT_SEED_RULESET = 'cross-sport@1';

interface MappingSeed {
  sport: string;
  kind: 'recognition' | 'result';
  value: string;
  band: 'S' | 'A' | 'B' | 'C' | 'D';
  note: string;
}

/** §11.4 seed mappings, reviewed against the source policy in T2.6. Hall/Ballon d'Or/GM title are legacy only. */
export const CROSS_SPORT_SEED_MAPPINGS: MappingSeed[] = [
  { sport: 'boxing', kind: 'recognition', value: 'undisputed', band: 'S', note: 'handoff §11.4: undisputed champion' },
  { sport: 'boxing', kind: 'recognition', value: 'wbc', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'wba', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'ibf', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'wbo', band: 'A', note: 'handoff §11.4: major world title' },
  { sport: 'boxing', kind: 'recognition', value: 'ibo', band: 'B', note: 'handoff §11.4: secondary world title' },
  { sport: 'football', kind: 'recognition', value: 'fifa-world-cup', band: 'S', note: 'handoff §11.4: World Cup title' },
  { sport: 'football', kind: 'recognition', value: 'fifa-womens-world-cup', band: 'S', note: 'handoff §11.4: World Cup title (women)' },
  { sport: 'football', kind: 'recognition', value: 'continental', band: 'A', note: 'handoff §11.4: continental championship' },
  { sport: 'football', kind: 'recognition', value: 'olympic-football', band: 'A', note: 'handoff §11.4: Olympic football gold ranks as continental' },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-gold', band: 'S', note: 'handoff §11.4: Olympic gold' },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-silver', band: 'A', note: 'handoff §11.4: Olympic silver' },
  { sport: 'multi-sport', kind: 'result', value: 'olympic-bronze', band: 'B', note: 'handoff §11.4: Olympic bronze' },
  { sport: 'jiu-jitsu', kind: 'recognition', value: 'adcc', band: 'S', note: 'handoff §11.4: ADCC champion' },
  { sport: 'jiu-jitsu', kind: 'recognition', value: 'ibjjf-world-championship', band: 'S', note: 'handoff §11.4: IBJJF Worlds champion' },
  { sport: 'jiu-jitsu', kind: 'recognition', value: 'pan', band: 'A', note: 'handoff §11.4: Pan champion' },
  { sport: 'chess', kind: 'recognition', value: 'classical', band: 'S', note: 'handoff §11.4: classical world champion' },
  { sport: 'chess', kind: 'recognition', value: 'rapid', band: 'A', note: 'handoff §11.4: rapid world champion' },
  { sport: 'chess', kind: 'recognition', value: 'blitz', band: 'B', note: 'handoff §11.4: blitz world champion' },
  { sport: 'ironman', kind: 'recognition', value: 'ironman-world-championship', band: 'S', note: 'handoff §11.4: Ironman world champion' },
  { sport: 'ironman', kind: 'result', value: 'podium', band: 'B', note: 'handoff §11.4: Ironman podium' },
];

/** Idempotent: deterministic ids on the natural key (ruleset + sport + kind + value). */
export const seedCrossSportMappings = async (db: Database): Promise<number> => {
  let count = 0;
  for (const mapping of CROSS_SPORT_SEED_MAPPINGS) {
    await upsertRow(db, T.crossSportMappings, {
      id: seedId('cross_sport', CROSS_SPORT_SEED_RULESET, mapping.sport, mapping.kind, mapping.value),
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
  return count;
};
