// pnpm --filter @was/db exec tsx src/cli/legacy-parity.cli.ts [--out <file>] — legacy → universal parity gate of the
// drop-legacy migration (handoff T1.2): for every mapping, counts the live legacy rows and those without a universal
// counterpart, and writes data/review/legacy-diff.md. Exit code 1 when anything is missing. Never migrates (it must run
// BEFORE the migration that drops the legacy tables); a mapping whose legacy table is already gone reports 0 rows.
import fs from 'node:fs';
import path from 'node:path';

import { sql } from 'drizzle-orm';

import { findRepoRoot } from '../helpers/repo-root.helper';
import { seedId } from '../helpers/seed-id.helper';
import { selectRows } from '../helpers/select-rows.helper';
import type { CliOptions } from '../interfaces/cli-options.interface';
import { BaseCli } from './base.cli';
import type { LegacyParityCheck } from './legacy-parity-check.interface';

/** Rows shown per mapping in the "missing" section of the report. */
const MAX_LISTED = 25;

class LegacyParityCli extends BaseCli {
  constructor(options: CliOptions = {}) {
    super({ ...options, migrate: false });
  }

  private async rows<T>(query: string): Promise<T[]> {
    return selectRows<T>(this.db, sql.raw(query));
  }

  private async exists(table: string, column?: string): Promise<boolean> {
    const [row] = await this.rows<{ n: number }>(
      `select count(*)::int n from information_schema.columns where table_schema = 'public' and table_name = '${table}'${column ? ` and column_name = '${column}'` : ''}`,
    );
    return (row?.n ?? 0) > 0;
  }

  /** Ids present in a universal table (empty when the table does not exist yet). */
  private async ids(table: string): Promise<Set<string>> {
    if (!(await this.exists(table))) return new Set();
    return new Set((await this.rows<{ id: string }>(`select id from ${table} where deleted_at is null`)).map((r) => r.id));
  }

  /** Legacy rows linked by id: the universal row reuses the legacy id or the backfill's deterministic seed id. */
  private byId(mapping: string, legacyTable: string, universalTable: string, seedPrefix: string, label: string): LegacyParityCheck {
    return {
      mapping,
      legacyTable,
      run: async () => {
        const legacy = await this.rows<{ id: string; label: string }>(`select id, ${label} as label from ${legacyTable} x where deleted_at is null`);
        const have = await this.ids(universalTable);
        return { legacy: legacy.map((r) => r.label), missing: legacy.filter((r) => !have.has(r.id) && !have.has(seedId(seedPrefix, r.id))).map((r) => r.label) };
      },
    };
  }

  /** Legacy rows linked by a SQL condition (`x` = the legacy row); `universal` lists the tables (or table.column) it needs. */
  private bySql(mapping: string, legacyTable: string, from: string, label: string, linked: string, universal: string[], legacyColumn?: string): LegacyParityCheck {
    return {
      mapping,
      legacyTable,
      legacyColumn,
      run: async () => {
        const legacy = await this.rows<{ label: string }>(`select ${label} as label from ${from}`);
        for (const target of universal) if (!(await this.exists(...(target.split('.') as [string, string?])))) return { legacy: legacy.map((r) => r.label), missing: legacy.map((r) => r.label) };
        const missing = await this.rows<{ label: string }>(`select ${label} as label from ${from} and not exists (${linked})`);
        return { legacy: legacy.map((r) => r.label), missing: missing.map((r) => r.label) };
      },
    };
  }

  private checks(): LegacyParityCheck[] {
    const athlete = (column: string) => `(select slug from athletes where id = x.${column})`;
    return [
      this.byId(
        'achievements → recognition_grants',
        'achievements',
        'recognition_grants',
        'grant',
        `${athlete('athlete_id')} || ' ' || x.year || ' ' || coalesce((select slug from achievement_types t where t.id = x.achievement_type_id), '?')`,
      ),
      this.bySql(
        'awards → recognition_definitions',
        'awards',
        'awards x where x.deleted_at is null',
        'x.slug',
        `select 1 from recognition_definitions d where d.slug = 'award--' || x.slug and d.deleted_at is null and d.competition_level_id is not distinct from x.competition_level_id`,
        ['recognition_definitions.competition_level_id'],
      ),
      this.bySql(
        'award_translations → recognition_definition_translations',
        'award_translations',
        'award_translations x join awards a on a.id = x.award_id where x.deleted_at is null',
        `a.slug || ' (' || x.locale || ')'`,
        `select 1 from recognition_definition_translations t join recognition_definitions d on d.id = t.definition_id where d.slug = 'award--' || a.slug and t.locale = x.locale and t.name = x.name and t.deleted_at is null`,
        ['recognition_definition_translations'],
      ),
      this.byId('award_editions → recognition_cycles', 'award_editions', 'recognition_cycles', 'cycle', `(select slug from awards where id = x.award_id) || ' ' || x.year`),
      this.byId('title_reigns → title_holdings', 'title_reigns', 'title_holdings', 'holding', `${athlete('athlete_id')} || ' ' || x.won_date`),
      this.bySql(
        'athlete_nationalities → competitor_representations',
        'athlete_nationalities',
        'athlete_nationalities x where x.deleted_at is null',
        `${athlete('athlete_id')} || ' ' || coalesce((select coalesce(iso2, code) from countries where id = x.country_id), '?')`,
        `select 1 from competitor_representations r where r.competitor_id = x.athlete_id and r.representation_id = x.country_id and r.deleted_at is null`,
        ['competitor_representations'],
      ),
      this.bySql(
        'athlete_teams → competitor_memberships',
        'athlete_teams',
        'athlete_teams x where x.deleted_at is null',
        `${athlete('athlete_id')} || ' @ ' || coalesce((select slug from teams where id = x.team_id), '?')`,
        `select 1 from competitor_memberships m where m.member_id = x.athlete_id and m.parent_id = x.team_id and m.from_year is not distinct from x.from_year and m.deleted_at is null`,
        ['competitor_memberships'],
      ),
      this.byId('athlete_stats → competitor_stat_extensions', 'athlete_stats', 'competitor_stat_extensions', 'statext', `${athlete('athlete_id')} || ' ' || x.period`),
      this.bySql(
        'sport_categories → category_sets',
        'sport_categories',
        'sport_categories x where x.deleted_at is null',
        'x.slug',
        `select 1 from category_sets s where s.slug = x.slug and s.deleted_at is null`,
        ['category_sets'],
      ),
      this.bySql(
        'sport_category_translations → category_set_translations',
        'sport_category_translations',
        'sport_category_translations x join sport_categories c on c.id = x.category_id where x.deleted_at is null',
        `c.slug || ' (' || x.locale || ')'`,
        `select 1 from category_set_translations t join category_sets s on s.id = t.set_id where s.slug = c.slug and t.locale = x.locale and t.name = x.name and t.deleted_at is null`,
        ['category_set_translations'],
      ),
      this.bySql(
        'athletes.nicknames → entity_aliases (nickname)',
        'athletes',
        'athletes a cross join lateral unnest(a.nicknames) as x(name) where a.deleted_at is null',
        `a.slug || ': ' || x.name`,
        `select 1 from entity_aliases e join domain_values k on k.id = e.kind_id and k.slug = 'nickname' where e.entity_id = a.id and e.name = x.name and e.deleted_at is null`,
        ['entity_aliases'],
        'nicknames',
      ),
      ...(['external_ids', 'social_links'] as const).map((column) =>
        this.bySql(
          `athletes.${column} → entity_external_ids`,
          'athletes',
          `athletes a cross join lateral jsonb_each_text(a.${column}) as x(provider, value) where a.deleted_at is null`,
          `a.slug || ': ' || x.provider || '=' || x.value`,
          `select 1 from entity_external_ids e where e.entity_id = a.id and e.provider = x.provider and e.external_id = x.value and e.deleted_at is null`,
          ['entity_external_ids'],
          column,
        ),
      ),
      this.bySql(
        'athletes.wikidata_qid → entity_external_ids (wikidata)',
        'athletes',
        'athletes x where x.deleted_at is null and x.wikidata_qid is not null',
        `x.slug || ': ' || x.wikidata_qid`,
        `select 1 from entity_external_ids e where e.entity_id = x.id and e.provider = 'wikidata' and e.external_id = x.wikidata_qid and e.deleted_at is null`,
        ['entity_external_ids'],
        'wikidata_qid',
      ),
    ];
  }

  protected async run(): Promise<number> {
    const results: { check: LegacyParityCheck; legacy: number; missing: string[]; dropped: boolean }[] = [];
    for (const check of this.checks()) {
      const dropped = !(await this.exists(check.legacyTable, check.legacyColumn));
      const { legacy, missing } = dropped ? { legacy: [], missing: [] } : await check.run();
      results.push({ check, legacy: legacy.length, missing, dropped });
    }
    const totalMissing = results.reduce((s, r) => s + r.missing.length, 0);
    const out = this.flag('out') ?? path.join(findRepoRoot(), 'data/review/legacy-diff.md');
    const lines = [
      '# Legacy → universal parity',
      '',
      `Generated by \`packages/db/src/cli/legacy-parity.cli.ts\` (${this.database.driver}). Gate of the drop-legacy migration: every live`,
      'legacy row must have its universal counterpart (same id or the backfill seed id, else the natural key). "dropped" = the legacy',
      'table or column no longer exists.',
      '',
      `**Missing: ${totalMissing}**`,
      '',
      '| Mapping | Legacy rows | Universal (matched) | Missing |',
      '|---|---:|---:|---:|',
      ...results.map((r) =>
        r.dropped ? `| ${r.check.mapping} | dropped | — | 0 |` : `| ${r.check.mapping} | ${r.legacy} | ${r.legacy - r.missing.length} | ${r.missing.length} |`,
      ),
      '',
    ];
    for (const r of results.filter((x) => x.missing.length)) {
      lines.push(`## Missing: ${r.check.mapping}`, '');
      for (const label of r.missing.slice(0, MAX_LISTED)) lines.push(`- ${label}`);
      if (r.missing.length > MAX_LISTED) lines.push(`- … ${r.missing.length - MAX_LISTED} more`);
      lines.push('');
    }
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, lines.join('\n'));
    this.log(`[db] legacy parity: ${totalMissing} missing → ${out}`);
    return totalMissing ? 1 : 0;
  }
}

await new LegacyParityCli().start();
