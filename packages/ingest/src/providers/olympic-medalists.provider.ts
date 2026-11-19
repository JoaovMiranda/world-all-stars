// Provider `olympic-medalists` (handoff v3 §6.5, F03): ONLY medallists, from "List of Olympic medalists in <sport>"
// (Wikipedia; the IOC library is forbidden). Each event section × Games row × medal column becomes a result:
// individual events → a person; relays/teams (several names in one cell) → a group competitor with its members.
import { InformationKind, type DiscoveredCompetitor, type EventRecord } from '@was/shared';

import { linkOrText } from '../parsers/wikitext';
import type { IngestContext } from './context';
import { personRef } from './football-champions.provider';

export const OLYMPIC_PROVIDER = 'olympic-medalists';
const PARSER = { key: 'olympic-medal-list', version: '1' };
const MEDAL_COLUMNS = ['gold', 'silver', 'bronze'] as const;
const MEDALIST_TPL = /\{\{\s*flagIOCmedalist\s*\|\s*((?:\[\[[^\]]*\]\]|[^|{}])+?)\s*\|\s*([A-Z]{3})\s*(?:\|[^{}]*)?\}\}/g;

export interface MedalCell {
  event: string;
  year: number;
  medal: (typeof MEDAL_COLUMNS)[number];
  athletes: { name: string; link: string | null }[];
  country: string;
}

/** Medal cells of a "List of Olympic medalists in X" page: section = event; row = Games; columns = gold/silver/bronze. */
export const parseMedalList = (text: string): MedalCell[] => {
  const out: MedalCell[] = [];
  let event = '';
  let row: string[] = [];
  const flush = () => {
    const year = Number(/\b(18|19|20)\d{2}\b/.exec(row[0] ?? '')?.[0]);
    if (year && row.length >= 2) {
      row.slice(1, 4).forEach((cell, i) => {
        const medalists = [...cell.matchAll(MEDALIST_TPL)];
        if (!medalists.length) return;
        const country = medalists[0]![2]!;
        out.push({ event, year, medal: MEDAL_COLUMNS[i]!, country, athletes: medalists.map((m) => { const [name, link] = linkOrText(m[1]!); return { name, link }; }) });
      });
    }
    row = [];
  };
  for (const line of text.split('\n')) {
    const h = /^={2,4}\s*(.*?)\s*={2,4}\s*$/.exec(line);
    if (h) {
      flush();
      event = h[1]!.replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, '$1');
      continue;
    }
    if (line.startsWith('|-') || line.startsWith('|}')) {
      flush();
      continue;
    }
    if (line.startsWith('|') && !line.startsWith('|+')) row.push(...line.slice(1).split('||'));
    else if (line.startsWith('!') && row.length === 0 && /\b(18|19|20)\d{2}\b/.test(line)) row.push(line.slice(1));
  }
  flush();
  return out;
};

export const runOlympicMedalists = async (ctx: IngestContext, opts: { sport: string; listTitle: string; year?: number | undefined }) => {
  const page = await ctx.wiki(opts.listTitle);
  if (!page) return [`${opts.listTitle}: page not found`];
  const cells = parseMedalList(page.text).filter((c) => !opts.year || c.year === opts.year);
  for (const c of cells) {
    const women = /women/i.test(c.event);
    const team = c.athletes.length > 1;
    const event: EventRecord = {
      competition: { recordKey: 'competition:olympic-games-summer', name: 'Summer Olympic Games', externalIds: {} },
      sport: opts.sport,
      organization: { recordKey: 'organization:ioc', name: 'IOC', externalIds: {} },
      edition: { label: String(c.year), year: c.year, kind: 'edition' },
      stage: null,
      event: { label: c.event, discipline: null, format: 'race_measured', composition: team ? 'relay' : 'individual', categories: { sex_category: women ? 'women' : /mixed/i.test(c.event) ? 'mixed' : 'men' } },
    };
    const people = c.athletes.map((a) => ({ ...personRef(a.name, a.link), kind: 'person' as const, sports: [opts.sport], aliases: [], members: [], birthDate: null, gender: null }));
    const competitor: DiscoveredCompetitor = team
      ? { recordKey: `group:${opts.sport}:${c.year}:${c.event}:${c.country}`, name: `${c.country} · ${c.event} ${c.year}`, externalIds: {}, kind: 'group', sports: [opts.sport], aliases: [], members: people.map((p) => ({ person: p, role: null })), birthDate: null, gender: null }
      : people[0]!;
    await ctx.observe(page.documentId, OLYMPIC_PROVIDER, PARSER, `${c.year}:${c.event}:${c.medal}:${competitor.recordKey}`, InformationKind.Result, {
      contract: 'result',
      record: { event, competitor, rank: MEDAL_COLUMNS.indexOf(c.medal) + 1, tied: false, status: 'finished', metrics: {}, extension: null },
    });
  }
  return [`${opts.listTitle}${opts.year ? ` ${opts.year}` : ''}: ${cells.length} medals (${cells.filter((c) => c.athletes.length > 1).length} team/relay)`];
};
