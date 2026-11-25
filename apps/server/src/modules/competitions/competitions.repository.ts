import { BaseReadRepository } from '@was/db';
import type { Locale } from '@was/shared';
import { sql } from 'drizzle-orm';

import { UNKNOWN_ORGANIZER_SLUG } from '../catalog/catalog.const';
import type { CompetitionRow, EditionRow, EntryRow, EventRow, LineupRow, MemberRow, NationRow, ResultRow, SourceLinkRow } from './competition-rows.interface';
import { competitorColumnsSql, competitorJoinsSql, domainLabelSql, idList, localizedSql, personColumnsSql, personJoinsSql } from './competitions-sql.helper';

/**
 * Read model of the competition and edition pages (T4.1): competitions, editions (fictional `is_example` editions
 * excluded), events, entries, members, final lineups, results, nations and source links. Query-only.
 */
export class CompetitionsRepository extends BaseReadRepository {
  async competition(slug: string, locale: Locale): Promise<CompetitionRow | undefined> {
    const [row] = await this.selectRows<CompetitionRow>(sql`
      select c.id, c.slug, c.is_olympic as "isOlympic", c.is_multi_sport as "isMultiSport", c.wikidata_qid as "wikidataQid",
        c.updated_at as "updatedAt",
        ${localizedSql('competition_translations', 'competition_id', 'c.id', 'name', locale)} as name,
        ${localizedSql('competition_translations', 'competition_id', 'c.id', 'locale', locale)} as "nameLocale",
        sp.slug as "sportSlug", coalesce(${localizedSql('sport_translations', 'sport_id', 'sp.id', 'name', locale)}, sp.slug) as "sportName",
        sp.color_token as "sportColor",
        case when o.slug <> ${UNKNOWN_ORGANIZER_SLUG} then o.slug end as "orgSlug",
        case when o.slug <> ${UNKNOWN_ORGANIZER_SLUG} then o.name end as "orgName",
        cl.slug::text as level
      from competitions c
      left join sports sp on sp.id = c.sport_id and sp.deleted_at is null
      left join organizations o on o.id = c.organization_id and o.deleted_at is null
      left join competition_levels cl on cl.id = c.competition_level_id
      where c.deleted_at is null and c.slug = ${slug}
      limit 1`);
    return row;
  }

  editions(competitionId: string, locale: Locale): Promise<EditionRow[]> {
    return this.selectRows<EditionRow>(sql`
      select e.id, e.year, e.label, e.edition_number as number, e.start_date::text as "startDate", e.end_date::text as "endDate",
        e.status::text as status, e.updated_at as "updatedAt", e.host_country_id as "hostCountryId",
        ${localizedSql('city_translations', 'city_id', 'e.host_city_id', 'name', locale)} as "hostCity"
      from competition_editions e
      where e.deleted_at is null and e.is_example = false and e.competition_id = ${competitionId}
      order by e.year nulls last, e.edition_number nulls last, e.start_date nulls last, e.id`);
  }

  /** Entries ranked first in an event of the given editions (competition page winners). */
  winners(editionIds: readonly string[]): Promise<EntryRow[]> {
    return this.selectRows<EntryRow>(sql`
      select distinct en.id as "entryId", en.edition_id as "editionId", en.event_id as "eventId", ${competitorColumnsSql('en')}
      from competition_results r
      join competition_entries en on en.id = r.entry_id and en.deleted_at is null
      ${competitorJoinsSql('en')}
      where r.deleted_at is null and r.scope = 'event' and r.rank = 1 and en.edition_id in ${idList(editionIds)}
      order by name`);
  }

  events(editionId: string, locale: Locale): Promise<EventRow[]> {
    return this.selectRows<EventRow>(sql`
      select ev.id, ev.label,
        coalesce(${localizedSql('category_set_translations', 'set_id', 'cs.id', 'name', locale)}, cs.label) as category
      from competition_events ev
      left join category_sets cs on cs.id = ev.category_set_id and cs.deleted_at is null
      where ev.deleted_at is null and ev.edition_id = ${editionId}
      order by ev.label, ev.id`);
  }

  entries(editionId: string): Promise<EntryRow[]> {
    return this.selectRows<EntryRow>(sql`
      select en.id as "entryId", en.edition_id as "editionId", en.event_id as "eventId", ${competitorColumnsSql('en')}
      from competition_entries en
      ${competitorJoinsSql('en')}
      where en.deleted_at is null and en.edition_id = ${editionId}
      order by name, en.id`);
  }

  /** Event results of the edition with their marks as the source wrote them. */
  results(editionId: string, locale: Locale): Promise<ResultRow[]> {
    return this.selectRows<ResultRow>(sql`
      select r.scope_id as "eventId", r.entry_id as "entryId", r.rank, r.rank_tied as tied, ${domainLabelSql('rs', locale)} as status,
        (select string_agg(m.value_original, ' · ' order by m.value_original) from result_metrics m
          where m.result_id = r.id and m.deleted_at is null) as mark
      from competition_results r
      join competition_events ev on ev.id = r.scope_id and ev.deleted_at is null and ev.edition_id = ${editionId}
      join domain_values rs on rs.id = r.status_id
      where r.deleted_at is null and r.scope = 'event'
      order by r.rank nulls last, r.entry_id`);
  }

  /** People registered in the entries of the edition (squads, crews, relay members). */
  members(editionId: string, locale: Locale): Promise<MemberRow[]> {
    return this.selectRows<MemberRow>(sql`
      select m.entry_id as "entryId", ${personColumnsSql()},
        case when ro.id is not null then ${domainLabelSql('ro', locale)} end as role,
        case when po.id is not null then ${domainLabelSql('po', locale)} end as position,
        m.shirt_number as "shirtNumber"
      from entry_members m
      join competition_entries en on en.id = m.entry_id and en.deleted_at is null and en.edition_id = ${editionId}
      ${personJoinsSql('m.person_id')}
      left join domain_values ro on ro.id = m.role_id
      left join domain_values po on po.id = m.position_id
      where m.deleted_at is null and m.verification <> 'rejected'
      order by m.shirt_number nulls last, name`);
  }

  /** Documented participations of the final contests of the edition (starters first). */
  lineups(editionId: string, locale: Locale): Promise<LineupRow[]> {
    return this.selectRows<LineupRow>(sql`
      select ct.id as "contestId", ct.label as contest, ct.date::text as date, ct.event_id as "eventId", p.entry_id as "entryId",
        ${personColumnsSql()}, ${domainLabelSql('pr', locale)} as role
      from contests ct
      join competition_events ev on ev.id = ct.event_id and ev.deleted_at is null and ev.edition_id = ${editionId}
      join contest_participations p on p.contest_id = ct.id and p.deleted_at is null
      ${personJoinsSql('p.person_id')}
      join domain_values pr on pr.id = p.role_id
      where ct.deleted_at is null and lower(ct.label) = 'final'
      order by ct.sequence, p.entry_id, case when pr.slug = 'starter' then 0 else 1 end, pr.sort_order, name`);
  }

  nations(ids: readonly string[], locale: Locale): Promise<NationRow[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.selectRows<NationRow>(sql`
      select n.id, coalesce(n.iso2, n.code, n.iso3, n.id::text) as code, n.flag_emoji as flag,
        coalesce(${localizedSql('country_translations', 'country_id', 'n.id', 'name', locale)}, n.code, n.iso2, n.id::text) as name
      from countries n where n.id in ${idList(ids)}`);
  }

  /**
   * Source links of the given entities (competition, editions) and of the results, entries and members of the given
   * editions, with their registry source when known.
   */
  sources(entityIds: readonly string[], editionIds: readonly string[]): Promise<SourceLinkRow[]> {
    const editions = idList(editionIds);
    return this.selectRows<SourceLinkRow>(sql`
      select distinct sl.url, s.slug, s.name, s.license, s.base_url as home
      from source_links sl
      left join sources s on s.id = sl.source_id and s.deleted_at is null
      where sl.deleted_at is null and sl.is_active and (
        sl.entity_id in ${idList(entityIds)}
        or sl.id in (select r.source_link_id from competition_results r join competition_entries en on en.id = r.entry_id
          where r.deleted_at is null and en.edition_id in ${editions})
        or sl.id in (select en.source_link_id from competition_entries en where en.deleted_at is null and en.edition_id in ${editions})
        or sl.id in (select m.source_link_id from entry_members m join competition_entries en on en.id = m.entry_id
          where m.deleted_at is null and en.edition_id in ${editions})
      )
      order by s.name nulls last, sl.url
      limit 60`);
  }
}
