// Wikitext parsing shared by the providers: a faithful TypeScript port of scripts/crawler/crawl_athletes.py
// (lineups, medal sections, squads, infobox winner), plus a generic wikitable reader that keeps the year and the
// column header (division) of every cell — the data the Python crawler threw away for BJJ.
export type NameLink = readonly [name: string, link: string | null];

const LINK = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
const LINK_ONE = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/;

export const stripMarkup = (s: string): string => {
  let out = s.replace(/<ref[^>]*\/>|<ref[^>]*>[\s\S]*?<\/ref>/g, '').replace(/\[\[(?:File|Image):[^\]]*\]\]/g, '');
  for (let i = 0; i < 3; i++) out = out.replace(/\{\{[^{}]*\}\}/g, '');
  return out;
};

/** Last [[link]] of a cell (label, target) or its plain text. Handles &nbsp; and {{sortname|A|B|link}}. */
export const linkOrText = (raw: string): NameLink => {
  let cell = raw.replace(/&nbsp;/g, ' ');
  cell = cell.replace(/\{\{\s*sortname\s*\|([^|}]*)\|([^|}]*)(?:\|([^|}=]*))?[^}]*\}\}/g, (_m, a: string, b: string, c?: string) => `[[${(c || `${a} ${b}`).trim()}|${a.trim()} ${b.trim()}]]`);
  cell = stripMarkup(cell);
  const links = [...cell.matchAll(LINK)].filter((m) => !/^(File:|Image:|Captain)/.test(m[1]!));
  if (links.length) {
    const m = links[links.length - 1]!;
    return [(m[2] ?? m[1]!).trim(), m[1]!.trim()];
  }
  const txt = cell.replace(/<[^>]+>|'''?|\(c\)/g, '').replace(/^[\s|-]+|[\s|-]+$/g, '');
  return [txt, null];
};

const NAME_FIELD = /\|\s*name\s*=\s*((?:\[\[[^\]]*\]\]|\{\{[^{}]*\}\}|[^|{}[])+)/;
export const playerName = (tpl: string): NameLink | null => {
  const m = NAME_FIELD.exec(tpl);
  return m ? linkOrText(m[1]!) : null;
};

/** Body of the section whose heading matches `headingRe` (until the next heading of the same or higher level). */
export const section = (text: string, headingRe: string): string | null => {
  const re = new RegExp(`^=+\\s*(?:${headingRe})\\s*=+\\s*$`, 'mi');
  const m = re.exec(text);
  if (!m) return null;
  const level = /^=+/.exec(m[0])![0].length;
  const rest = text.slice(m.index + m[0].length);
  const next = new RegExp(`^={2,${level}}[^=]`, 'm').exec(rest);
  return next ? rest.slice(0, next.index) : rest;
};

const ROW = /^\|\s*([A-Z]{2,3})\s*\|\|(?:\s*(?:'''\s*)?\d+(?:\s*''')?\s*\|\|)?(.+)$/;

/** Blocks of starters (name, link) in page order (a new `{|` table starts a block; substitutes are skipped). */
export const lineupBlocks = (text: string): NameLink[][] => {
  const blocks: NameLink[][] = [];
  let cur: NameLink[] = [];
  let inStarters = true;
  for (const line of text.split('\n')) {
    const ls = line.trim();
    if (ls.startsWith('{|')) {
      if (cur.length >= 9) blocks.push(cur);
      cur = [];
      inStarters = true;
      continue;
    }
    if (/Substitut/.test(ls)) {
      if (cur.length) blocks.push(cur);
      cur = [];
      inStarters = false;
      continue;
    }
    if (/Manager|Coach|Head coach/.test(ls) && !inStarters) {
      inStarters = true;
      continue;
    }
    const m = ROW.exec(ls);
    if (m && inStarters) cur.push(linkOrText(m[2]!.split('||')[0]!));
  }
  if (cur.length) blocks.push(cur);
  return blocks.filter((b) => b.length >= 9);
};

export const winnerSide = (box: string, names: readonly string[]): 0 | 1 | null => {
  for (const line of box.split('\n')) {
    for (const [side, idx] of [['team1', 0], ['team2', 1]] as const) {
      if (new RegExp(`^\\s*\\|\\s*${side}\\s*=`).test(line) && names.some((n) => line.toLowerCase().includes(n.toLowerCase()))) return idx;
    }
  }
  return null;
};

export const finalStarters = (text: string, names: readonly string[]): NameLink[] | null => {
  const blocks = lineupBlocks(text);
  const side = winnerSide(text, names);
  if (side === null || blocks.length < 2) return null;
  return blocks[side]!.slice(0, 11);
};

/** Winner of a final from its infobox: score, then penalties. */
export const infoboxWinner = (text: string): string | null => {
  const f: Record<string, string> = {};
  for (const m of text.slice(0, 8000).matchAll(/^\|\s*(team[12](?:score|penalties)?|penalties[12])\s*=\s*(.*)$/gm)) f[m[1]!] = m[2]!;
  const t1 = linkOrText(f.team1 ?? '')[0];
  const t2 = linkOrText(f.team2 ?? '')[0];
  const num = (k: string) => Number((f[k] ?? '').replace(/\D/g, '') || -1);
  let s1 = num('team1score');
  let s2 = num('team2score');
  if (s1 === s2) {
    s1 = 'team1penalties' in f ? num('team1penalties') : num('penalties1');
    s2 = 'team2penalties' in f ? num('team2penalties') : num('penalties2');
  }
  if (s1 === s2 || !t1 || !t2) return null;
  return s1 > s2 ? t1 : t2;
};

/** Player templates of a squad section ({{nat fs g player|…|name=[[X]]}}). */
export const squadPlayers = (sec: string): NameLink[] =>
  [...sec.matchAll(/\{\{nat fs (?:g )?player([^}]*(?:\{\{[^}]*\}\}[^}]*)*)\}\}/g)].map((m) => playerName(m[1]!)).filter((n): n is NameLink => !!n && !!n[0]);

// ── Olympic football medals ──
export const IOC_NAMES: Record<string, string[]> = {
  GBR: ['Great Britain'], BEL: ['Belgium'], URU: ['Uruguay'], ITA: ['Italy'], SWE: ['Sweden'], HUN: ['Hungary'], URS: ['Soviet Union'], YUG: ['Yugoslavia'],
  POL: ['Poland'], GDR: ['East Germany'], TCH: ['Czechoslovakia'], FRA: ['France'], FRG: ['West Germany'], EUN: ['Unified Team'], ESP: ['Spain'], NGR: ['Nigeria'],
  CMR: ['Cameroon'], ARG: ['Argentina'], MEX: ['Mexico'], BRA: ['Brazil'], USA: ['United States'], NOR: ['Norway'], GER: ['Germany'], CAN: ['Canada'],
};
export const FIFA_TO_IOC: Record<string, string> = { SPA: 'ESP', NGA: 'NGR', CSK: 'TCH', DDR: 'GDR', FRG: 'FRG', URS: 'URS' };
const COUNTRY_TPL = /\{\{\s*(?:[Ff][Ll][Aa][Gg][Ii][Oo][Cc]\w*|[Ff][Bb][\w-]*|[Ff]lagcountry|[Ff]lag)\s*\|(?:\s*\d+\s*\|)?\s*([A-Z]{3}\b|[A-Z][a-z][A-Za-z .]+?)\s*(?:\|[^{}]*)?\}\}/g;
const SKIP_NAME = /^(?:coach|manager|gold|silver|bronze|men|women|valign|style|width|rowspan|colspan|event)\b/i;

export const toIoc = (val: string): string => {
  const v = val.trim();
  if (/^[A-Z]{3}$/.test(v)) return FIFA_TO_IOC[v] ?? v;
  return Object.entries(IOC_NAMES).find(([, names]) => names.includes(v))?.[0] ?? v;
};

/** Names of a medal block; those after <hr> are reserves (only if names came before it). */
export const chunkNames = (raw: string): { core: NameLink[]; reserves: NameLink[] } => {
  const chunk = raw.replace(/\{\{\s*Medals table[\s\S]*?\}\}/g, '').replace(/^.*\bcoach\b.*$/gim, '');
  const core: NameLink[] = [];
  const reserves: NameLink[] = [];
  chunk.split(/<hr\s*\/?>/).forEach((part, partIndex) => {
    const target = partIndex > 0 && core.length ? reserves : core;
    for (let piece of part.split(/<br\s*\/?>|\n/)) {
      piece = piece.replace(/''\(captain\)''|\(captain\)/g, '');
      if (!piece.trim() || (new RegExp(COUNTRY_TPL.source).test(piece) && !LINK_ONE.test(stripMarkup(piece)))) continue;
      const [rawName, link] = linkOrText(piece);
      const name = rawName.replace(/<[^>]+>|\{\{.*|^[|!:;\s]+|[|\s]+$/g, '').replace(/^[\s*–-]+|[\s*–-]+$/g, '');
      if (!name || name.length < 3 || SKIP_NAME.test(name) || /[{}=]|\d{3}/.test(name)) continue;
      target.push([name, link]);
    }
  });
  return { core, reserves };
};

/** Champion of each edition from the finals table of "Football at the Summer Olympics". */
export const olympicGolds = (text: string): Map<string, string> => {
  const out = new Map<string, string>();
  for (const [gender, head] of [['Men', /==Men's tournament==/], ['Women', /==Women's tournament==/]] as const) {
    const m = head.exec(text);
    if (!m) continue;
    let body = text.slice(m.index + m[0].length);
    const stop = /^==[^=]/m.exec(body);
    if (stop) body = body.slice(0, stop.index);
    for (const row of body.split(/\n\|-/)) {
      const y = /\[\[(?:association )?football at the (\d{4}) Summer Olympics/i.exec(row);
      const g = /'''\s*\{\{\s*fb\w*\s*\|(?:\s*\d+\s*\|)?\s*([A-Z]{3}\b|[A-Z][a-z][A-Za-z .]+?)\s*[|}]/.exec(row);
      if (y && g) out.set(`${gender}:${y[1]}`, toIoc(g[1]!));
    }
  }
  return out;
};

const columnTableGold = (part: string, code: string): NameLink[] => {
  const rows = part.split(/\n\|-[^\n]*/);
  for (let i = 0; i < rows.length - 1; i++) {
    const row = rows[i]!;
    const countries = [...row.matchAll(COUNTRY_TPL)].map((m) => toIoc(m[1]!));
    if (countries.length < 2 || !countries.includes(code) || LINK_ONE.test(stripMarkup(row))) continue;
    const cells = `\n${rows[i + 1]!.trim()}`.split(/\n\s*\|(?!\})/).filter((c) => c.trim());
    const idx = countries.indexOf(code);
    if (idx < cells.length) return chunkNames(cells[idx]!.replace(/^[^|[]*\|(?!\|)/, '')).core;
  }
  return [];
};

/** (squad, reserves) of the gold medal of `event` ('Men' | 'Women') for country `code`. */
export const medalistsGold = (text: string, event: 'Men' | 'Women', code: string): { core: NameLink[]; reserves: NameLink[] } => {
  const sec = section(text, 'Medal(?:l)?ists|Medal winners|Medal summary') ?? '';
  if (!sec) return { core: [], reserves: [] };
  const w = /(?:^|\||=|\])\s*(?:\[\[[^|\]]*\|)?Women(?:'s)?\b/m.exec(sec);
  const part = event === 'Men' ? (w ? sec.slice(0, w.index) : sec) : w ? sec.slice(w.index) : '';
  const hits = [...part.matchAll(COUNTRY_TPL)];
  let best = { core: [] as NameLink[], reserves: [] as NameLink[] };
  hits.forEach((h, i) => {
    if (toIoc(h[1]!) !== code) return;
    const end = i + 1 < hits.length ? hits[i + 1]!.index! : part.length;
    const got = chunkNames(part.slice(h.index! + h[0].length, end));
    if (got.core.length + got.reserves.length > best.core.length + best.reserves.length) best = got;
  });
  if (!best.core.length) best = { core: columnTableGold(part, code), reserves: [] };
  return best;
};

// ── Generic wikitable reader (BJJ champions by year × division) ──
export interface TableCell {
  year: number | null;
  column: string;
  heading: string;
  /** Every heading above the cell, outermost first (gender often lives in a parent heading). */
  path: string[];
  raw: string;
}

/** Every data cell of every wikitable in `text`, with its column header, the row's year and the current heading. */
export const wikitableCells = (text: string): TableCell[] => {
  const out: TableCell[] = [];
  let heading = '';
  const stack: string[] = [];
  let headingYear: number | null = null;
  let header: string[] = [];
  let inTable = false;
  let rowCells: string[] = [];
  const flush = () => {
    if (!rowCells.length) return;
    const first = stripMarkup(rowCells[0] ?? '');
    const yearMatch = /\b(19|20)\d{2}\b/.exec(first);
    const year = yearMatch ? Number(yearMatch[0]) : headingYear;
    const offset = yearMatch ? 0 : -1;
    rowCells.forEach((raw, i) => {
      if (i === 0 && yearMatch) return;
      out.push({ year, column: header[i + (offset < 0 ? 1 : 0)] ?? header[i] ?? `col${i}`, heading, path: stack.filter(Boolean), raw });
    });
    rowCells = [];
  };
  for (const line of text.split('\n')) {
    const h = /^(=+)\s*(.*?)\s*=+\s*$/.exec(line);
    if (h) {
      flush();
      heading = h[2]!;
      stack.length = h[1]!.length;
      stack[h[1]!.length - 1] = heading;
      const y = /^(19|20)\d{2}$/.exec(heading.trim());
      headingYear = y ? Number(y[0]) : /\b(19|20)\d{2}\b/.test(heading) && !/–|-/.test(heading) ? headingYear : null;
      continue;
    }
    if (line.startsWith('{|')) {
      inTable = true;
      header = [];
      continue;
    }
    if (!inTable) continue;
    if (line.startsWith('|}')) {
      flush();
      inTable = false;
      continue;
    }
    if (line.startsWith('|-')) {
      flush();
      continue;
    }
    if (line.startsWith('!')) {
      header = line
        .slice(1)
        .split('!!')
        .map((c) => stripMarkup(c.includes('|') && !c.includes('[[') ? c.slice(c.lastIndexOf('|') + 1) : c).replace(/&nbsp;/g, ' ').replace(/'''/g, '').trim());
      continue;
    }
    if (line.startsWith('|')) rowCells.push(...line.slice(1).split('||'));
  }
  flush();
  return out;
};

const CHAMP = /(?:<small>|\{\{\s*small\s*\|)\s*\(\s*\d+\s*\/\s*\d+\s*\)/;

export interface BjjChampion {
  name: string;
  link: string | null;
  gender: 'men' | 'women';
  year: number | null;
  division: string;
}

/** Champions between the start and end headings: name/link, gender (from headings), year and division (column). */
export const bjjChampions = (text: string, startRe: RegExp, endRe: RegExp): BjjChampion[] => {
  const s = startRe.exec(text);
  if (!s) return [];
  const rest = text.slice(s.index);
  const e = endRe.exec(rest.slice(1));
  const body = e ? rest.slice(0, e.index + 1) : rest;
  return wikitableCells(body)
    .filter((c) => CHAMP.test(c.raw))
    .map((c) => {
      const before = c.raw.slice(0, CHAMP.exec(c.raw)!.index);
      const [n, link] = linkOrText(before);
      const name = n.replace(/^\d{4}\s*/, '').replace(/^[\s|]+|[\s|]+$/g, '');
      const gender: 'men' | 'women' = c.path.some((p) => /women/i.test(p)) ? 'women' : 'men';
      return { name, link, gender, year: c.year, division: c.column.replace(/\s+/g, ' ') };
    })
    .filter((c) => c.name && !/^\d/.test(c.name));
};
