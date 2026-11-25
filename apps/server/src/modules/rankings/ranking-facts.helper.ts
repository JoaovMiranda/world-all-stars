import type { Database } from '@was/db';
import type { Locale } from '@was/shared';
import { sql } from 'drizzle-orm';

import type { RankingCategoryFact } from './ranking-category-fact.interface';
import type { RankingCountryFact } from './ranking-country-fact.interface';
import type { RankingCountryRow } from './ranking-country-row.interface';
import type { RankingEntryFacts } from './ranking-entry-facts.interface';
import { rows } from './rankings-sql.helper';

/** json/jsonb columns come back parsed (PGlite, postgres-js) or as text, depending on the driver. */
const json = <T>(value: unknown): T[] => {
  if (value === null || value === undefined) return [];
  const parsed = typeof value === 'string' ? (JSON.parse(value) as unknown) : value;
  return Array.isArray(parsed) ? (parsed.filter((v) => v !== null) as T[]) : [];
};
const text = (value: unknown): string | null => (value === null || value === undefined || value === '' ? null : String(value));

/** Normalizes a country row; null when it has no usable code. */
const countryFact = (c: RankingCountryRow): RankingCountryFact | null => {
  const value = (c.code ?? c.iso2)?.toLowerCase();
  if (!value) return null;
  const codes = [...new Set([c.code, c.iso2, c.iso3, c.ioc].filter((v): v is string => !!v).map((v) => v.toLowerCase()))];
  return { value, ioc: c.ioc ? c.ioc.toUpperCase() : null, codes, name: c.name ?? value.toUpperCase() };
};

/** Country JSON object built in SQL from `countries co` + its translation `ctr`. */
const countryJson = sql`json_build_object('code', co.code, 'iso2', co.iso2, 'iso3', co.iso3, 'ioc', co.ioc_code, 'name', ctr.name)`;

/**
 * Filterable facts of every entry of a snapshot (T2.5): competitor gender, represented countries and positions, and for
 * each counted evidence (BJJ results, football squad memberships) its competition, organization, edition, sport,
 * position, represented country and event categories (sex, gi, belt, weight). Two queries per snapshot.
 */
export const rankingEntryFacts = async (db: Database, snapshotId: string, locale: Locale): Promise<Map<string, RankingEntryFacts>> => {
  const competitorRows = await rows(
    db,
    sql`
    select e.id entry_id, a.gender,
      (select json_agg(${countryJson}) from competitor_representations cr
        join countries co on co.id = cr.representation_id
        left join country_translations ctr on ctr.country_id = co.id and ctr.locale = ${locale} and ctr.deleted_at is null
        where cr.competitor_id = e.competitor_id and cr.deleted_at is null) countries,
      (select json_agg(distinct s.position) from athlete_sports s
        where s.athlete_id = e.competitor_id and s.deleted_at is null and s.position is not null) positions
    from ranking_entries e
    left join athletes a on a.id = e.competitor_id
    where e.snapshot_id = ${snapshotId} and e.deleted_at is null`,
  );
  const itemRows = await rows(
    db,
    sql`
    select i.entry_id, c.slug competition, ct.name competition_name, o.slug organization, o.name organization_name, ed.year edition,
      coalesce(sp.slug, csp.slug) sport, coalesce(spt.name, cspt.name) sport_name, pos.slug position, post.name position_name,
      (select ${countryJson} from countries co
        left join country_translations ctr on ctr.country_id = co.id and ctr.locale = ${locale} and ctr.deleted_at is null
        where co.id = ce.representation_id) country,
      (select json_agg(json_build_object('dimension', d.slug, 'slug', v.slug, 'label', v.original_label)) from category_set_values sv
        join category_values v on v.id = sv.value_id
        join category_dimensions d on d.id = v.dimension_id
        where sv.set_id = ev.category_set_id and sv.deleted_at is null) categories
    from ranking_entry_items i
    join ranking_entries e on e.id = i.entry_id and e.snapshot_id = ${snapshotId}
    left join competition_results r on i.evidence_type = 'competition_results' and r.id = i.evidence_id
    left join entry_members m on i.evidence_type = 'entry_members' and m.id = i.evidence_id
    join competition_entries ce on ce.id = coalesce(r.entry_id, m.entry_id)
    left join competition_events ev on ev.id = coalesce(case when r.scope = 'event' then r.scope_id end, ce.event_id)
    join competition_editions ed on ed.id = ce.edition_id
    join competitions c on c.id = ed.competition_id
    left join competition_translations ct on ct.competition_id = c.id and ct.locale = ${locale} and ct.deleted_at is null
    left join organizations o on o.id = c.organization_id
    left join sports sp on sp.id = ev.sport_id
    left join sport_translations spt on spt.sport_id = sp.id and spt.locale = ${locale} and spt.deleted_at is null
    left join sports csp on csp.id = c.sport_id
    left join sport_translations cspt on cspt.sport_id = csp.id and cspt.locale = ${locale} and cspt.deleted_at is null
    left join domain_values pos on pos.id = m.position_id
    left join domain_value_translations post on post.value_id = pos.id and post.locale = ${locale} and post.deleted_at is null
    where i.deleted_at is null`,
  );
  const facts = new Map<string, RankingEntryFacts>();
  for (const r of competitorRows)
    facts.set(String(r.entry_id), {
      gender: text(r.gender),
      countries: json<RankingCountryRow>(r.countries)
        .map(countryFact)
        .filter((c): c is RankingCountryFact => c !== null),
      positions: json<string>(r.positions),
      items: [],
    });
  for (const r of itemRows) {
    const entry = facts.get(String(r.entry_id));
    if (!entry) continue;
    const country = r.country ? countryFact((typeof r.country === 'string' ? JSON.parse(r.country) : r.country) as RankingCountryRow) : null;
    entry.items.push({
      competition: text(r.competition),
      competitionName: text(r.competition_name),
      organization: text(r.organization),
      organizationName: text(r.organization_name),
      edition: r.edition === null || r.edition === undefined ? null : Number(r.edition),
      sport: text(r.sport),
      sportName: text(r.sport_name),
      position: text(r.position),
      positionName: text(r.position_name),
      country,
      categories: json<RankingCategoryFact>(r.categories),
    });
  }
  return facts;
};
