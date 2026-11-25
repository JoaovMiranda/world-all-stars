import { BaseReadRepository } from '@was/db';
import { CROSS_SPORT_RULESET_VERSION, type CrossSportMapping } from '@was/ranking';
import { sql } from 'drizzle-orm';

import type { LegacyContext } from './legacy-context.interface';
import type { PublishedFact } from './published-fact.interface';

/** Name of a translated row in the request locale, then English, then the fallback column (identifiers are constants). */
const translated = (table: string, fk: string, id: string, locale: string, fallback: string) => {
  const name = (lang: string) =>
    sql`(select t.name from ${sql.raw(table)} t where t.${sql.raw(fk)} = ${sql.raw(id)} and t.deleted_at is null and t.locale = ${lang} limit 1)`;
  return sql`coalesce(${name(locale)}, ${name('en')}, ${sql.raw(fallback)})`;
};

/**
 * Read model of the cross-sport bands and legacy levels: published grants (status granted/retroactive) of public
 * athletes, the mapping rows of the active ruleset and the legacy context. Query-only; ordered by id so every run
 * reads the same sequence.
 */
export class CrossSportRepository extends BaseReadRepository {
  /** Published grants of every public athlete, or of one athlete. */
  facts(locale: string, competitorId?: string): Promise<PublishedFact[]> {
    return this.selectRows<PublishedFact>(sql`
      select g.id as "evidenceId", g.version, g.competitor_id as "competitorId", sp.slug as sport,
        ${translated('sport_translations', 'sport_id', 'sp.id', locale, 'sp.slug')} as "sportName",
        k.slug as "recognitionKind", lv.slug as level, c.slug as competition, coalesce(c.is_olympic, false) as olympic,
        coalesce(dl.slug, cl.slug)::text as "competitionLevel", o.slug as issuer, d.slug as definition, coalesce(g.year, cy.year) as year,
        ${translated('recognition_definition_translations', 'definition_id', 'd.id', locale, 'd.slug')} as label,
        a.known_as as "competitorName", a.slug as "competitorSlug", a.gender
      from recognition_grants g
      join recognition_definitions d on d.id = g.definition_id and d.deleted_at is null
      join domain_values k on k.id = d.kind_id
      join domain_values gs on gs.id = g.status_id
      join athletes a on a.id = g.competitor_id and a.deleted_at is null
      join competitors cp on cp.id = a.id and cp.deleted_at is null and cp.profile_visibility = 'public'
      left join domain_values lv on lv.id = g.level_id
      left join competitions c on c.id = d.competition_id
      left join competition_levels dl on dl.id = d.competition_level_id
      left join competition_levels cl on cl.id = c.competition_level_id
      left join organizations o on o.id = d.issuer_org_id
      left join sports sp on sp.id = coalesce(d.sport_id, c.sport_id)
      left join recognition_cycles cy on cy.id = g.cycle_id
      where g.deleted_at is null and gs.slug in ('granted', 'retroactive') ${competitorId ? sql`and g.competitor_id = ${competitorId}` : sql``}
      order by g.id`);
  }

  /** Names of the given sports in the request locale (slug → name). */
  async sportNames(slugs: readonly string[], locale: string): Promise<Map<string, string>> {
    if (!slugs.length) return new Map();
    const rows = await this.selectRows<{ slug: string; name: string }>(sql`
      select sp.slug, ${translated('sport_translations', 'sport_id', 'sp.id', locale, 'sp.slug')} as name
      from sports sp where sp.deleted_at is null and sp.slug in (${sql.join(
        slugs.map((s) => sql`${s}`),
        sql`, `,
      )})`);
    return new Map(rows.map((r) => [r.slug, r.name]));
  }

  /** Mapping rows of the active cross-sport ruleset (`cross-sport@1`). */
  async mappings(): Promise<(CrossSportMapping & { rulesetKey: string })[]> {
    const rows = await this.selectRows<CrossSportMapping & { rulesetKey: string }>(sql`
      select ruleset_key as "rulesetKey", sport, kind, value, band, from_year as "fromYear", to_year as "toYear", source_note as "sourceNote"
      from cross_sport_mappings where deleted_at is null and ruleset_key = ${CROSS_SPORT_RULESET_VERSION}
      order by sport, kind, value, from_year`);
    return rows.map((r) => ({ ...r, fromYear: r.fromYear || null }));
  }

  /** Public athlete by slug (id + career span), or undefined. */
  async athlete(slug: string): Promise<{ id: string; careerStartYear: number | null; careerEndYear: number | null } | undefined> {
    const [row] = await this.selectRows<{ id: string; careerStartYear: number | null; careerEndYear: number | null }>(sql`
      select a.id, a.career_start_year as "careerStartYear", a.career_end_year as "careerEndYear"
      from athletes a join competitors cp on cp.id = a.id and cp.deleted_at is null and cp.profile_visibility = 'public'
      where a.deleted_at is null and a.slug = ${slug} limit 1`);
    return row;
  }

  /** Dossier status and record marks of an athlete (the legacy context besides grants). */
  async legacyContext(athlete: { id: string; careerStartYear: number | null; careerEndYear: number | null }, locale: string): Promise<LegacyContext> {
    const [dossier] = await this.selectRows<{ status: string }>(sql`
      select status::text as status from greats_dossiers where deleted_at is null and athlete_id = ${athlete.id} limit 1`);
    const records = await this.selectRows<LegacyContext['records'][number]>(sql`
      select m.id as "evidenceId", extract(year from m.date)::int as year, rs.slug = 'ratified' as ratified,
        ${translated('recognition_definition_translations', 'definition_id', 'd.id', locale, 'd.slug')} as label
      from record_marks m
      join recognition_definitions d on d.id = m.definition_id
      join domain_values rs on rs.id = m.ratification_status_id
      where m.deleted_at is null and m.competitor_id = ${athlete.id}
      order by m.id`);
    return { careerStartYear: athlete.careerStartYear, careerEndYear: athlete.careerEndYear, dossierStatus: dossier?.status ?? null, records };
  }
}
