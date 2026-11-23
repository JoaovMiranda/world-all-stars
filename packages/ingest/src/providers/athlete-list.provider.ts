// Provider `athlete-list` (handoff v3 Phase 13 §1.2): identities from a list (CSV, names or Wikipedia links). Each line
// resolves to its English Wikipedia article (redirects followed); the article title is the stable id, so the
// writer matches people that already exist and creates the rest. A listed person gets a public profile.
import { type DiscoveredCompetitor, InformationKind, wikipediaApiUrl, wikipediaTitleFromUrl } from '@was/shared';

import { ATHLETE_LIST_PROVIDER } from './athlete-list.const';
import type { AthleteListResult } from './athlete-list-result.interface';
import { BaseProvider } from './base.provider';
import { personRef } from './football-champions.provider';
import type { IngestContext } from './ingest-context.interface';
import type { ListEntry } from './list-entry.interface';

/** CSV (`name,sport` with optional header), one name per line, or Wikipedia links. Pure: exported for tests. */
export const parseAthleteList = (text: string, defaultSport: string | null = null): ListEntry[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^name\s*(,|$)/i.test(l) && !l.startsWith('#'))
    .map((l) => {
      const [raw, sport] = l.split(',').map((x) => x.trim());
      const linked = /wikipedia\.org\/wiki\/[^?#]+/.test(raw!) ? wikipediaTitleFromUrl(raw!) : null;
      return { name: linked ?? raw!, sport: sport || defaultSport };
    });

export class AthleteListProvider extends BaseProvider<ListEntry[]> {
  readonly key = ATHLETE_LIST_PROVIDER;
  readonly parser = { key: 'athlete-list', version: '1' };

  /** `names` (one per line, CSV or links) and an optional default `sport`. */
  protected parseOptions(params: Record<string, unknown>): ListEntry[] {
    return parseAthleteList(String(params.names ?? ''), params.sport ? String(params.sport) : null);
  }

  async run(ctx: IngestContext, entries: ListEntry[]): Promise<string[]> {
    const r = await this.resolve(ctx, entries);
    return [`athlete-list: ${r.resolved} resolved, ${r.missing.length} without an unambiguous article`];
  }

  /** Resolves each line to its article (50 titles per call) and observes one identity per resolved line. */
  async resolve(ctx: IngestContext, entries: ListEntry[]): Promise<AthleteListResult> {
    const titles: string[] = [];
    const missing: string[] = [];
    for (const batch of this.batch(entries)) {
      const url = wikipediaApiUrl('en', {
        action: 'query',
        titles: batch.map((b) => b.name).join('|'),
        redirects: '1',
        prop: 'pageprops',
        ppprop: 'disambiguation',
        format: 'json',
        formatversion: '2',
      });
      const doc = await this.fetchJson<{
        query?: {
          normalized?: { from: string; to: string }[];
          redirects?: { from: string; to: string }[];
          pages?: { title: string; missing?: boolean; pageprops?: { disambiguation?: string } }[];
        };
      }>(ctx, 'wikipedia-en', url);
      if (!doc) continue;
      const q = doc.data.query ?? {};
      const follow = (t: string) => {
        let x = q.normalized?.find((n) => n.from === t)?.to ?? t;
        x = q.redirects?.find((r) => r.from === x)?.to ?? x;
        return x;
      };
      for (const e of batch) {
        const title = follow(e.name);
        const page = q.pages?.find((p) => p.title === title);
        if (!page || page.missing || page.pageprops?.disambiguation !== undefined) {
          missing.push(e.name); // ambiguous or absent: never guessed
          continue;
        }
        const record: DiscoveredCompetitor = {
          ...personRef(title.replace(/ \(.*\)$/, ''), title), // the QID (and birth, gender) comes from the wikidata provider
          kind: 'person',
          sports: e.sport ? [e.sport] : [],
          aliases: [{ name: e.name, kind: 'display', locale: null }],
          members: [],
          birthDate: null,
          gender: null,
        };
        await this.observe(ctx, doc.documentId, `list:${title}`, InformationKind.Identity, { contract: 'competitor', record });
        titles.push(title);
      }
    }
    return { resolved: titles.length, titles, missing };
  }
}

/** Resolves a list (used by the autonomous collection). */
export const runAthleteList = (ctx: IngestContext, entries: ListEntry[]): Promise<AthleteListResult> => new AthleteListProvider().resolve(ctx, entries);
