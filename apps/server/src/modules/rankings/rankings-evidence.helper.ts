import { athletes, type Database } from '@was/db';
import type { RankingEvidence } from '@was/ranking';
import { inArray, sql } from 'drizzle-orm';

import { rows } from './rankings-sql.helper';

/** Football evidence: memberships of champion squads (entry with rank 1) of the four tournaments (F01). */
export const footballEvidence = async (db: Database): Promise<RankingEvidence[]> =>
  (
    await rows(
      db,
      sql`
    select m.id, m.version, m.person_id, c.slug competition, ed.year, reg.slug registration, m.verification, app.slug appearance
    from entry_members m
    join competition_entries e on e.id = m.entry_id
    join competition_results r on r.entry_id = e.id and r.rank = 1 and r.deleted_at is null
    join competition_editions ed on ed.id = e.edition_id
    join competitions c on c.id = ed.competition_id
    join domain_values reg on reg.id = m.registration_status_id
    join domain_values app on app.id = m.appearance_id
    where m.deleted_at is null and c.slug in ('fifa-world-cup', 'fifa-womens-world-cup', 'olympic-football', 'olympic-football-women')`,
    )
  ).map((r) => ({
    id: String(r.id),
    version: Number(r.version),
    kind: 'squad_membership',
    competitorId: String(r.person_id),
    attributes: {
      competition: String(r.competition),
      year: Number(r.year),
      registration: String(r.registration),
      verification: String(r.verification),
      appeared: r.appearance === 'appeared' ? true : r.appearance === 'did_not_appear' ? false : null,
    },
  }));

/** BJJ evidence: individual results of ADCC/IBJJF with the category set (belt, gi, gender, division). */
export const bjjEvidence = async (db: Database): Promise<RankingEvidence[]> =>
  (
    await rows(
      db,
      sql`
    select r.id, r.version, e.competitor_id, c.slug competition, ed.year, r.rank placement, cs.label division,
      coalesce((select fp.review_status::text from field_provenance fp where fp.entity_id = r.id and fp.deleted_at is null order by fp.created_at desc limit 1), 'auto_accepted') review,
      max(case when d.slug = 'gi_mode' then v.slug end) gi, max(case when d.slug = 'sex_category' then v.slug end) gender, max(case when d.slug = 'belt' then v.slug end) belt
    from competition_results r
    join competition_entries e on e.id = r.entry_id
    join competition_events ev on ev.id = r.scope_id
    join competition_editions ed on ed.id = ev.edition_id
    join competitions c on c.id = ed.competition_id
    left join category_sets cs on cs.id = ev.category_set_id
    left join category_set_values sv on sv.set_id = cs.id
    left join category_values v on v.id = sv.value_id
    left join category_dimensions d on d.id = v.dimension_id
    where r.deleted_at is null and r.scope = 'event' and c.slug in ('adcc', 'ibjjf-world-championship')
    group by r.id, r.version, e.competitor_id, c.slug, ed.year, r.rank, cs.label`,
    )
  ).map((r) => ({
    id: String(r.id),
    version: Number(r.version),
    kind: 'result',
    competitorId: String(r.competitor_id),
    attributes: {
      competition: String(r.competition),
      year: Number(r.year),
      placement: Number(r.placement),
      division: String(r.division ?? ''),
      tier: 'world',
      giMode: String(r.gi ?? ''),
      gender: String(r.gender ?? ''),
      belt: r.belt ? String(r.belt) : r.gi === 'no-gi' ? null : 'black',
      // Wikipedia tables are provisional until an admin approves the sample (handoff v3 Fase 10).
      verification: r.review === 'approved' ? 'verified' : 'provisional',
      status: 'official',
    },
  }));

export const competitorsOf = async (db: Database, ids: string[]) => {
  if (!ids.length) return [];
  const people = await db.select({ id: athletes.id, name: athletes.knownAs }).from(athletes).where(inArray(athletes.id, ids));
  return people.map((p) => ({ id: p.id, name: p.name, kind: 'person' as const }));
};
