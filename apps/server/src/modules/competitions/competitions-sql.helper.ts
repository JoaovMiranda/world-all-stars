import type { Locale } from '@was/shared';
import { type SQL, sql } from 'drizzle-orm';

import { FALLBACK_CHAIN } from '../catalog/catalog.const';

/** Translation rows ordered by the content fallback: requested locale, then the chain (en, pt-BR), then any. */
const localeOrder = (locale: Locale): SQL => {
  const chain = [locale, ...FALLBACK_CHAIN.filter((l) => l !== locale)];
  return sql`case ${sql.join(
    chain.map((l, i) => sql`when tr.locale = ${l} then ${i}`),
    sql` `,
  )} else ${chain.length} end, tr.locale`;
};

/**
 * `column` of the best translation row of `idExpr` (identifiers are code constants, never input). Use `locale` as the
 * column to learn which language the text came in.
 */
export const localizedSql = (table: string, fk: string, idExpr: string, column: string, locale: Locale): SQL =>
  sql`(select tr.${sql.raw(column)} from ${sql.raw(table)} tr where tr.${sql.raw(fk)} = ${sql.raw(idExpr)} and tr.deleted_at is null order by ${localeOrder(locale)} limit 1)`;

/** Translated name of a domain value (`alias`.id), else its slug. */
export const domainLabelSql = (alias: string, locale: Locale): SQL =>
  sql`coalesce(${localizedSql('domain_value_translations', 'value_id', `${alias}.id`, 'name', locale)}, ${sql.raw(alias)}.slug)`;

/** `in (…)` list of ids; `in (null)` when empty (matches nothing). */
export const idList = (ids: readonly string[]): SQL =>
  ids.length
    ? sql`(${sql.join(
        ids.map((id) => sql`${id}`),
        sql`, `,
      )})`
    : sql`(null)`;

/**
 * Columns of the competitor `cp` (joined with `competitorJoins`): kind, display name, public profile slug (listable
 * athletes only) and the represented nation (entry representation, team country, else primary representation).
 */
export const competitorColumnsSql = (entryAlias: string): SQL =>
  sql.raw(`
  cp.id as "competitorId", cp.kind::text as kind,
  coalesce(a.known_as, tm.name, g.name, cp.id::text) as name,
  case when a.id is not null and cp.profile_visibility = 'public'
    and exists (select 1 from athlete_sports s where s.athlete_id = a.id and s.deleted_at is null) then a.slug end as slug,
  coalesce(
    (select n.id from countries n where n.id = ${entryAlias}.representation_id and n.deleted_at is null),
    tm.country_id,
    (select r.representation_id from competitor_representations r join countries n on n.id = r.representation_id and n.deleted_at is null
      where r.competitor_id = cp.id and r.deleted_at is null order by r.is_primary desc, r.representation_id limit 1)
  ) as "nationId"`);

/** Joins giving `cp`, `a` (athlete), `tm` (team) and `g` (group) for the competitor of `entryAlias`. */
export const competitorJoinsSql = (entryAlias: string): SQL =>
  sql.raw(`
  join competitors cp on cp.id = ${entryAlias}.competitor_id and cp.deleted_at is null
  left join athletes a on a.id = cp.id and a.deleted_at is null
  left join teams tm on tm.id = cp.id and tm.deleted_at is null
  left join competitor_groups g on g.id = cp.id and g.deleted_at is null`);

/** Name and public profile slug of a person joined as `pc` (competitor) + `pa` (athlete) by `personJoinsSql`. */
export const personColumnsSql = (): SQL =>
  sql.raw(`
  coalesce(pa.known_as, pc.id::text) as name,
  case when pa.id is not null and pc.profile_visibility = 'public'
    and exists (select 1 from athlete_sports s where s.athlete_id = pa.id and s.deleted_at is null) then pa.slug end as slug`);

/** Joins giving `pc` and `pa` for the person `personIdExpr`. */
export const personJoinsSql = (personIdExpr: string): SQL =>
  sql.raw(`
  join competitors pc on pc.id = ${personIdExpr} and pc.deleted_at is null
  left join athletes pa on pa.id = pc.id and pa.deleted_at is null`);
