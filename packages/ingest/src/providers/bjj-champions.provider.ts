// Provider `bjj-champions` (handoff v3 §6.5, F04): ADCC and World IBJJF black-belt champions from the Wikipedia
// tables, WITH year, division (weight column as the organization names it), gender and gi mode. The IBJJF site is
// forbidden: the Wikipedia tables are the permitted source. Divisions are NOT made equivalent across organizations.
import { type DiscoveredCompetitor, type EventRecord, InformationKind } from '@was/shared';

import { bjjChampions } from '../parsers/wikitext';
import { BaseProvider } from './base.provider';
import { BJJ_COMPETITIONS, BJJ_PROVIDER, USER_BJJ } from './bjj-champions.const';
import type { BjjOptions } from './bjj-options.interface';
import { personRef } from './football-champions.provider';
import type { IngestContext } from './ingest-context.interface';

const person = (name: string, link: string | null, gender: 'men' | 'women' | null): DiscoveredCompetitor => ({
  ...personRef(name, link),
  kind: 'person',
  sports: ['jiu-jitsu'],
  aliases: [],
  members: [],
  birthDate: null,
  gender: gender === 'men' ? 'male' : gender === 'women' ? 'female' : null,
});

const eventOf = (competition: keyof typeof BJJ_COMPETITIONS, year: number, gender: 'men' | 'women', division: string): EventRecord => ({
  competition: { recordKey: `competition:${competition}`, name: BJJ_COMPETITIONS[competition].names[0], externalIds: {} },
  sport: 'jiu-jitsu',
  organization: { recordKey: `organization:${BJJ_COMPETITIONS[competition].org}`, name: BJJ_COMPETITIONS[competition].org.toUpperCase(), externalIds: {} },
  edition: { label: String(year), year, kind: 'edition' },
  stage: null,
  event: {
    label: `${gender === 'men' ? 'Men' : 'Women'} · ${division}`,
    discipline: null,
    format: 'knockout',
    composition: 'individual',
    categories: {
      sex_category: gender,
      weight: division,
      gi_mode: BJJ_COMPETITIONS[competition].gi,
      ...(competition === 'ibjjf-world-championship' ? { belt: 'black', age: 'adult' } : {}),
    },
  },
});

export class BjjChampionsProvider extends BaseProvider<BjjOptions> {
  readonly key = BJJ_PROVIDER;
  readonly parser = { key: 'bjj-champions', version: '1' };

  protected parseOptions(params: Record<string, unknown>): BjjOptions {
    return { only: params.only as string[] | undefined };
  }

  async run(ctx: IngestContext, opts: BjjOptions = {}): Promise<string[]> {
    const report: string[] = [];
    for (const [competition, title, start, end] of [
      ['adcc', 'ADCC Submission Fighting World Championship', /^=== List of ADCC Champions in Men/m, /^=== List of winners by total titles/m],
      ['ibjjf-world-championship', 'World IBJJF Jiu-Jitsu Championship', /^=== Men's black belt world champions/m, /^== List of winners by total titles/m],
    ] as const) {
      const page = await ctx.wiki(title);
      if (!page) {
        report.push(`${competition}: page not found`);
        continue;
      }
      const champions = bjjChampions(page.text, start, end).filter((c) => c.year && (!opts.only?.length || opts.only.includes(`${competition}:${c.year}`)));
      for (const c of champions) {
        const event = eventOf(competition, c.year!, c.gender, c.division);
        await this.observe(ctx, page.documentId, `${competition}:${c.year}:${c.gender}:${c.division}:${c.link ?? c.name}`, InformationKind.Result, {
          contract: 'result',
          record: { event, competitor: person(c.name, c.link, c.gender), rank: 1, tied: false, status: 'won', metrics: {}, extension: null },
        });
      }
      report.push(
        `${competition}: ${champions.length} titles, ${new Set(champions.map((c) => c.link ?? c.name)).size} athletes (year + division on every title)`,
      );
    }
    // The user's seed list: identities with aliases (no titles invented).
    const seedDoc = await ctx.wiki('ADCC Submission Fighting World Championship');
    if (seedDoc) {
      for (const [name, title, nickname] of USER_BJJ) {
        await ctx.observe(seedDoc.documentId, this.key, { key: 'bjj-user-list', version: '1' }, `user:${title ?? name}`, InformationKind.Identity, {
          contract: 'competitor',
          record: {
            ...person(title ? title.replace(/ \(.*\)$/, '') : name, title, null),
            aliases: [{ name, kind: 'display', locale: null }, ...(nickname ? [{ name: nickname, kind: 'nickname', locale: null }] : [])],
          },
        });
      }
    }
    return report;
  }
}

/** Runs the provider (kept for callers and tests that predate the registry). */
export const runBjjChampions = (ctx: IngestContext, opts: BjjOptions = {}): Promise<string[]> => new BjjChampionsProvider().run(ctx, opts);
