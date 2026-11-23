// Provider `football-champions` (handoff v3 §6.5): champion squads, final starters and titles of the men's and
// women's World Cups (Fjelstul 1930–2022 / 1991–2019 + Wikipedia 2023/2026 and missing lineups) and of Olympic
// football (Wikipedia). Port of scripts/crawler/crawl_athletes.py; produces ONLY general contracts.
import { type DiscoveredCompetitor, type EntityRef, type EventRecord, InformationKind, wikipediaTitleFromUrl } from '@was/shared';

import { FIFA_TO_IOC } from '../parsers/fifa-to-ioc.const';
import { IOC_NAMES } from '../parsers/ioc-names.const';
import type { NameLink } from '../parsers/name-link.type';
import { finalStarters, infoboxWinner, lineupBlocks, medalistsGold, olympicGolds, section, squadPlayers } from '../parsers/wikitext';
import { BaseProvider } from './base.provider';
import type { ChampionSquad } from './champion-squad.interface';
import { FOOTBALL_COMPETITIONS, FOOTBALL_PROVIDER, MEN_OLYMPIC_YEARS, WOMEN_OLYMPIC_YEARS } from './football-champions.const';
import type { FootballOptions } from './football-options.interface';
import type { IngestContext } from './ingest-context.interface';

const FJELSTUL = 'https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv/';

const csv = (text: string): Record<string, string>[] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [head, ...body] = rows.filter((r) => r.length > 1);
  return body.map((r) => Object.fromEntries(head!.map((h, i) => [h, r[i] ?? ''])));
};

const norm = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();
export const personRef = (name: string, link: string | null, extra: Record<string, string> = {}): EntityRef => ({
  recordKey: `person:${link ? norm(link) : norm(name)}`,
  name: name.replace(/\s+/g, ' ').trim(),
  externalIds: { ...(link ? { wikipedia_en: link } : {}), ...extra },
});
const teamCompetitor = (country: string, gender: 'men' | 'women', members: DiscoveredCompetitor['members'] = []): DiscoveredCompetitor => ({
  recordKey: `team:football:${gender}:${norm(country)}`,
  name: country,
  externalIds: {},
  kind: 'team',
  sports: ['football'],
  aliases: [],
  members,
  birthDate: null,
  gender: null,
});
const eventOf = (competition: keyof typeof FOOTBALL_COMPETITIONS, year: number, gender: 'men' | 'women'): EventRecord => ({
  competition: { recordKey: `competition:${competition}`, name: FOOTBALL_COMPETITIONS[competition].names[0], externalIds: {} },
  sport: 'football',
  organization: { recordKey: `organization:${FOOTBALL_COMPETITIONS[competition].org}`, name: FOOTBALL_COMPETITIONS[competition].org, externalIds: {} },
  edition: { label: String(year), year, kind: 'edition' },
  stage: null,
  event: {
    label: gender === 'men' ? "Men's tournament" : "Women's tournament",
    discipline: null,
    format: 'group_and_knockout',
    composition: 'team',
    categories: { sex_category: gender },
  },
});

const starterPages = (year: number, women: boolean) =>
  year === 1950 ? ['Uruguay v Brazil (1950 FIFA World Cup)', 'Maracanazo'] : [`${year} FIFA ${women ? "Women's " : ''}World Cup final`];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** The starter as the SAME person ref as in the squad (link or normalized name), so identities line up. */
const matchMember = (sq: ChampionSquad, name: string, link: string | null): EntityRef => {
  const k = link ? norm(link) : null;
  const n = norm(name);
  return sq.members.find((m) => (k && norm(m.person.externalIds.wikipedia_en ?? '') === k) || norm(m.person.name) === n)?.person ?? personRef(name, link);
};

export class FootballChampionsProvider extends BaseProvider<FootballOptions> {
  readonly key = FOOTBALL_PROVIDER;
  readonly parser = { key: 'football-champions', version: '1' };

  protected parseOptions(params: Record<string, unknown>): FootballOptions {
    return { only: params.only as string[] | undefined, olympics: params.olympics !== false };
  }

  async run(ctx: IngestContext, opts: FootballOptions = {}): Promise<string[]> {
    const wanted = (competition: string, year: number) => !opts.only?.length || opts.only.includes(`${competition}:${year}`);
    const report: string[] = [];
    const tables: Record<string, { rows: Record<string, string>[]; documentId: string }> = {};
    for (const name of ['tournaments', 'tournament_standings', 'squads', 'players', 'player_appearances', 'matches']) {
      const doc = await ctx.document('fjelstul', `${FJELSTUL}${name}.csv`, { cacheFile: `fjelstul/${name}.csv` });
      if (!doc) throw new Error(`Fjelstul ${name}.csv unavailable`);
      tables[name] = { rows: csv(doc.text), documentId: doc.documentId };
    }
    const players = new Map(tables.players!.rows.map((p) => [p.player_id, p]));
    const champion = new Map(tables.tournament_standings!.rows.filter((s) => s.position === '1').map((s) => [s.tournament_id!, s.team_id!]));
    const lastMatch = new Map<string, { date: string; id: string }>();
    for (const m of tables.matches!.rows) {
      const t = champion.get(m.tournament_id!);
      if (t !== m.home_team_id && t !== m.away_team_id) continue;
      const cur = lastMatch.get(m.tournament_id!);
      if (!cur || `${m.match_date}${m.match_id}` > `${cur.date}${cur.id}`) lastMatch.set(m.tournament_id!, { date: m.match_date!, id: m.match_id! });
    }
    const appeared = new Map<string, Set<string>>();
    const starters = new Map<string, Set<string>>();
    for (const a of tables.player_appearances!.rows) {
      if (champion.get(a.tournament_id!) !== a.team_id) continue;
      (appeared.get(a.tournament_id!) ?? appeared.set(a.tournament_id!, new Set()).get(a.tournament_id!)!).add(a.player_id!);
      if (lastMatch.get(a.tournament_id!)?.id === a.match_id && a.starter === '1')
        (starters.get(a.tournament_id!) ?? starters.set(a.tournament_id!, new Set()).get(a.tournament_id!)!).add(a.player_id!);
    }
    const tournaments = new Map(tables.tournaments!.rows.map((t) => [t.tournament_id!, t]));
    const squads = new Map<string, ChampionSquad>();
    for (const s of tables.squads!.rows) {
      const tid = s.tournament_id!;
      if (champion.get(tid) !== s.team_id) continue;
      const t = tournaments.get(tid)!;
      const women = t.tournament_name!.includes('Women');
      const competition = women ? 'fifa-womens-world-cup' : 'fifa-world-cup';
      const year = Number(t.year);
      if (!wanted(competition, year)) continue;
      const sq =
        squads.get(tid) ??
        ({
          competition,
          year,
          gender: women ? 'women' : 'men',
          country: s.team_name!,
          documentId: tables.squads!.documentId,
          members: [],
          starters: [],
        } as ChampionSquad);
      const p = players.get(s.player_id!);
      const link = p?.player_wikipedia_link?.startsWith('http') ? wikipediaTitleFromUrl(p.player_wikipedia_link) : null;
      const name = `${s.given_name} ${s.family_name}`.replace('not applicable', '').trim();
      const person = personRef(name, link, { fjelstul: s.player_id! });
      const hasLineups = (appeared.get(tid)?.size ?? 0) > 0;
      sq.members.push({ person, appeared: hasLineups ? appeared.get(tid)!.has(s.player_id!) : null, reserve: false });
      if (starters.get(tid)?.has(s.player_id!)) sq.starters.push({ person, documentId: tables.player_appearances!.documentId });
      squads.set(tid, sq);
    }
    // Fjelstul has lineups only from 1970 (and none for 1999/2011): the final's Wikipedia page fills the starters.
    for (const [tid, sq] of squads) {
      if (sq.starters.length < 11) {
        const winner = tournaments.get(tid)!.winner!;
        for (const title of starterPages(sq.year, sq.gender === 'women')) {
          const page = await ctx.wiki(title);
          const got = page && finalStarters(page.text, [winner]);
          if (got && page) {
            sq.starters = got.map(([n, l]) => ({ person: matchMember(sq, n, l), documentId: page.documentId }));
            break;
          }
        }
      }
      await this.observeSquad(ctx, sq);
      report.push(`${sq.competition} ${sq.year} ${sq.country}: squad ${sq.members.length}, final starters ${sq.starters.length}`);
    }
    // 2023 (women) and 2026 (men): squads + final from Wikipedia.
    for (const [year, women, squadsPage, finalPage] of [
      [2023, true, "2023 FIFA Women's World Cup squads", "2023 FIFA Women's World Cup final"],
      [2026, false, '2026 FIFA World Cup squads', '2026 FIFA World Cup final'],
    ] as const) {
      const competition = women ? 'fifa-womens-world-cup' : 'fifa-world-cup';
      if (!wanted(competition, year)) continue;
      const final = await ctx.wiki(finalPage);
      const winner = final && infoboxWinner(final.text);
      const squadsDoc = await ctx.wiki(squadsPage);
      if (!final || !winner || !squadsDoc) {
        report.push(`${competition} ${year}: winner or squads not found`);
        continue;
      }
      const sq: ChampionSquad = {
        competition,
        year,
        gender: women ? 'women' : 'men',
        country: winner,
        documentId: squadsDoc.documentId,
        members: squadPlayers(section(squadsDoc.text, escapeRe(winner)) ?? '').map(([n, l]) => ({ person: personRef(n, l), appeared: null, reserve: false })),
        starters: [],
      };
      sq.starters = (finalStarters(final.text, [winner]) ?? []).map(([n, l]) => ({ person: matchMember(sq, n, l), documentId: final.documentId }));
      await this.observeSquad(ctx, sq);
      report.push(`${competition} ${year} ${winner}: squad ${sq.members.length}, final starters ${sq.starters.length}`);
    }
    if (opts.olympics !== false) report.push(...(await this.runOlympicFootball(ctx, wanted)));
    return report;
  }

  /** Writes entry (squad), participation (final starters) and result (title) observations of one champion squad. */
  private async observeSquad(ctx: IngestContext, sq: ChampionSquad): Promise<void> {
    const event = eventOf(sq.competition, sq.year, sq.gender);
    const team = teamCompetitor(sq.country, sq.gender);
    const key = `${sq.competition}:${sq.year}`;
    await this.observe(ctx, sq.documentId, `${key}:entry`, InformationKind.Entry, {
      contract: 'entry',
      record: {
        event,
        competitor: team,
        representation: { recordKey: `country:${norm(sq.country)}`, name: sq.country, externalIds: {} },
        status: 'registered',
        members: sq.members.map((m) => ({
          person: m.person,
          role: null,
          status: 'registered',
          appearance: m.reserve ? 'did_not_appear' : m.appeared === null ? 'unknown' : m.appeared ? 'appeared' : 'did_not_appear',
          shirtNumber: null,
        })),
      },
    });
    await this.observe(ctx, sq.documentId, `${key}:result`, InformationKind.Result, {
      contract: 'result',
      record: { event, competitor: team, rank: 1, tied: false, status: 'won', metrics: {}, extension: null },
    });
    for (const st of sq.starters) {
      await this.observe(ctx, st.documentId, `${key}:final:${st.person.recordKey}`, InformationKind.Lineup, {
        contract: 'participation',
        record: {
          event,
          contest: { label: 'Final', sequence: 999, date: null },
          competitor: { recordKey: team.recordKey, name: team.name, externalIds: {} },
          person: st.person,
          role: 'starter',
        },
      });
    }
  }

  /** Olympic football: champion from the finals table, squad from the medal section (or squads page), starters of the gold-medal match. */
  private async runOlympicFootball(ctx: IngestContext, wanted: (c: string, y: number) => boolean): Promise<string[]> {
    const report: string[] = [];
    const overview = await ctx.wiki('Football at the Summer Olympics');
    if (!overview) return ['olympic football: overview page not found'];
    const golds = olympicGolds(overview.text);
    for (const [gender, years] of [
      ['Men', MEN_OLYMPIC_YEARS],
      ['Women', WOMEN_OLYMPIC_YEARS],
    ] as const) {
      const competition = gender === 'Men' ? 'olympic-football' : 'olympic-football-women';
      for (const y of years) {
        if (!wanted(competition, y)) continue;
        const code = golds.get(`${gender}:${y}`);
        if (!code) {
          report.push(`${competition} ${y}: champion not found`);
          continue;
        }
        let base = `Football at the ${y} Summer Olympics`;
        const basePage = await ctx.wiki(base);
        if (basePage?.text.toLowerCase().includes('{{disambiguation')) base = `Association football at the ${y} Summer Olympics`;
        let gold: { core: NameLink[]; reserves: NameLink[] } = { core: [], reserves: [] };
        let goldDoc: string | null = null;
        for (const title of [base, `${base} – ${gender}'s tournament`]) {
          if (gold.core.length) break;
          const pg = await ctx.wiki(title);
          if (pg) {
            gold = medalistsGold(pg.text, gender, code);
            goldDoc = pg.documentId;
          }
        }
        if (gold.core.length < 11) {
          const names = IOC_NAMES[code] ?? [code];
          const g = gender === 'Men' ? "Men's" : "Women's";
          for (const title of [
            `Football at the ${y} Summer Olympics – ${g} team squads`,
            `Football at the ${y} Summer Olympics – ${g} tournament squads`,
            `Football at the ${y} Summer Olympics – Team squads`,
            `Football at the ${y} Summer Olympics squads`,
          ]) {
            const pg = await ctx.wiki(title);
            if (!pg) continue;
            const sec = names.map((n) => section(pg.text, escapeRe(n))).find(Boolean);
            const players = sec ? squadPlayers(sec) : [];
            if (players.length > gold.core.length) {
              gold = { core: players, reserves: [] };
              goldDoc = pg.documentId;
              break;
            }
          }
        }
        const country = (IOC_NAMES[code] ?? [code])[0]!;
        if (!gold.core.length || !goldDoc) {
          report.push(`${competition} ${y} ${country}: gold squad not found`);
          continue;
        }
        const sq: ChampionSquad = {
          competition,
          year: y,
          gender: gender === 'Men' ? 'men' : 'women',
          country,
          documentId: goldDoc,
          members: [
            ...gold.core.map(([n, l]) => ({ person: personRef(n, l), appeared: null, reserve: false })),
            ...gold.reserves.map(([n, l]) => ({ person: personRef(n, l), appeared: false, reserve: true })),
          ],
          starters: [],
        };
        const tname = `${gender}'s tournament`;
        const aliases = [
          ...(IOC_NAMES[code] ?? []),
          code,
          ...Object.entries(FIFA_TO_IOC)
            .filter(([, v]) => v === code)
            .map(([k]) => k),
        ];
        for (const title of [`${base} – ${tname} final`, `${base} – ${tname} – Knockout stage`, `${base} – ${tname}`, base]) {
          const pg = await ctx.wiki(title);
          if (!pg) continue;
          const sec = title.endsWith(' final') ? pg.text : (section(pg.text, 'Gold medal match|Final|Gold medal final|Final round|Gold Medal match') ?? '');
          if (sec.includes('#lst:') && !lineupBlocks(sec).length) continue;
          const st = sec ? finalStarters(sec, aliases) : null;
          if (st) {
            sq.starters = st.map(([n, l]) => ({ person: matchMember(sq, n, l), documentId: pg.documentId }));
            break;
          }
        }
        await this.observeSquad(ctx, sq);
        report.push(`${competition} ${y} ${country}: squad ${sq.members.length}, final starters ${sq.starters.length}`);
      }
    }
    return report;
  }
}

/** Runs the provider (kept for callers and tests that predate the registry). */
export const runFootballChampions = (ctx: IngestContext, opts: FootballOptions = {}): Promise<string[]> => new FootballChampionsProvider().run(ctx, opts);
