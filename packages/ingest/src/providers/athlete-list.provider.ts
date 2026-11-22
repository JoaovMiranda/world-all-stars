// Provider `athlete-list` (handoff v3 Fase 13 §1.2): identities from a list (CSV, names or Wikipedia links). Each line
// resolves to its English Wikipedia article (redirects followed); the article title is the stable id, so the
// writer matches people that already exist and creates the rest. A listed person gets a public profile.
import { InformationKind, type DiscoveredCompetitor } from '@was/shared';

import type { IngestContext } from './context';
import { personRef } from './football-champions.provider';

export const ATHLETE_LIST_PROVIDER = 'athlete-list';
const PARSER = { key: 'athlete-list', version: '1' };

export interface ListEntry {
  name: string;
  sport: string | null;
}

/** CSV (`name,sport` with optional header), one name per line, or Wikipedia links. Pure: exported for tests. */
export const parseAthleteList = (text: string, defaultSport: string | null = null): ListEntry[] =>
  text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !/^name\s*(,|$)/i.test(l) && !l.startsWith('#'))
    .map((l) => {
      const [raw, sport] = l.split(',').map((x) => x.trim());
      const link = raw!.match(/wikipedia\.org\/wiki\/([^?#]+)/);
      return { name: link ? decodeURIComponent(link[1]!).replaceAll('_', ' ') : raw!, sport: sport || defaultSport };
    });

export const runAthleteList = async (ctx: IngestContext, entries: ListEntry[]) => {
  const titles: string[] = [];
  const missing: string[] = [];
  for (let i = 0; i < entries.length; i += 50) {
    const batch = entries.slice(i, i + 50);
    const url = `https://en.wikipedia.org/w/api.php?${new URLSearchParams({ action: 'query', titles: batch.map((b) => b.name).join('|'), redirects: '1', prop: 'pageprops', ppprop: 'disambiguation', format: 'json', formatversion: '2' })}`;
    const doc = await ctx.document('wikipedia-en', url);
    if (!doc) continue;
    const q = (JSON.parse(doc.text) as { query?: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[]; pages?: { title: string; missing?: boolean; pageprops?: { disambiguation?: string } }[] } }).query ?? {};
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
        kind: 'person', sports: e.sport ? [e.sport] : [], aliases: [{ name: e.name, kind: 'display', locale: null }], members: [], birthDate: null, gender: null,
      };
      await ctx.observe(doc.documentId, ATHLETE_LIST_PROVIDER, PARSER, `list:${title}`, InformationKind.Identity, { contract: 'competitor', record });
      titles.push(title);
    }
  }
  return { resolved: titles.length, titles, missing };
};
