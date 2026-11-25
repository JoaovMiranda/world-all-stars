// Rows of the competitions read model → contract views (pure).
import {
  COMPETITION_LEVEL_VALUES,
  COMPETITION_STATUS_VALUES,
  COMPETITOR_KIND_VALUES,
  type CompetitionHeader,
  type CompetitionLevel,
  type CompetitionStatus,
  type CompetitorKind,
  type CompetitorRef,
  type EditionEvent,
  type EditionLineup,
  type EditionSquad,
  type NationRef,
  type SourceRef,
} from '@was/shared';

import type {
  CompetitionRow,
  CompetitorRow,
  EntryRow,
  EventRow,
  LineupRow,
  MemberRow,
  NationRow,
  ResultRow,
  SourceLinkRow,
} from './competition-rows.interface';

const oneOf = <T extends string>(values: readonly T[], v: string | null, fallback: T): T => (values.includes(v as T) ? (v as T) : fallback);

/** ISO datetime of a timestamp column (PGlite returns Date, node-postgres may return a string). */
export const isoOf = (v: Date | string): string => new Date(v).toISOString();

/** Latest of several ISO datetimes. */
export const latestIso = (values: readonly string[]): string => values.reduce((a, b) => (b > a ? b : a), values[0] ?? new Date(0).toISOString());

export const nationsById = (rows: readonly NationRow[]): Map<string, NationRef> =>
  new Map(rows.map((n) => [n.id, { code: n.code, name: n.name, flag: n.flag }]));

export const competitorRef = (row: CompetitorRow, nations: ReadonlyMap<string, NationRef>): CompetitorRef => ({
  name: row.name,
  slug: row.slug,
  kind: oneOf<CompetitorKind>(COMPETITOR_KIND_VALUES, row.kind, 'person'),
  nation: row.nationId ? (nations.get(row.nationId) ?? null) : null,
});

export const competitionHeader = (c: CompetitionRow): CompetitionHeader => ({
  slug: c.slug,
  name: c.name ?? c.slug,
  sport: c.sportSlug ? { slug: c.sportSlug, name: c.sportName ?? c.sportSlug, colorToken: c.sportColor ?? 'c-teal' } : null,
  organization: c.orgSlug && c.orgName ? { slug: c.orgSlug, name: c.orgName } : null,
  level: c.level ? oneOf<CompetitionLevel>(COMPETITION_LEVEL_VALUES, c.level, COMPETITION_LEVEL_VALUES[0]) : null,
  isOlympic: c.isOlympic,
  isMultiSport: c.isMultiSport,
  wikidataQid: c.wikidataQid,
});

export const editionStatus = (status: string): CompetitionStatus => oneOf<CompetitionStatus>(COMPETITION_STATUS_VALUES, status, 'finished');

/** Source links as SourceRef (registry source when known, else the link's host); invalid URLs dropped, one per URL. */
export const sourceRefs = (rows: readonly SourceLinkRow[]): SourceRef[] => {
  const out = new Map<string, SourceRef>();
  for (const r of rows) {
    if (!URL.canParse(r.url) || out.has(r.url)) continue;
    const url = new URL(r.url);
    const home = r.home && URL.canParse(r.home) ? r.home : url.origin;
    out.set(r.url, { slug: r.slug ?? url.hostname, name: r.name ?? url.hostname, license: r.license ?? '', url: r.url, home });
  }
  return [...out.values()];
};

/** Squads (entries with members) of one event. */
const squadsOf = (entries: readonly EntryRow[], members: readonly MemberRow[], nations: ReadonlyMap<string, NationRef>): EditionSquad[] =>
  entries
    .map((en) => ({
      competitor: competitorRef(en, nations),
      members: members
        .filter((m) => m.entryId === en.entryId)
        .map((m) => ({ name: m.name, slug: m.slug, role: m.role, position: m.position, shirtNumber: m.shirtNumber })),
    }))
    .filter((s) => s.members.length > 0);

/** Final lineups of one event: one block per contest, one side per entry. */
const lineupsOf = (rows: readonly LineupRow[], entryById: ReadonlyMap<string, EntryRow>, nations: ReadonlyMap<string, NationRef>): EditionLineup[] => {
  type Side = EditionLineup['sides'][number];
  const contests = new Map<string, { contest: string; date: string | null; sides: Side[]; bySide: Map<string, Side> }>();
  for (const r of rows) {
    const entry = entryById.get(r.entryId);
    if (!entry) continue;
    const contest = contests.get(r.contestId) ?? { contest: r.contest, date: r.date, sides: [] as Side[], bySide: new Map<string, Side>() };
    contests.set(r.contestId, contest);
    let side = contest.bySide.get(r.entryId);
    if (!side) {
      side = { competitor: competitorRef(entry, nations), players: [] };
      contest.bySide.set(r.entryId, side);
      contest.sides.push(side);
    }
    side.players.push({ name: r.name, slug: r.slug, role: r.role });
  }
  return [...contests.values()].map(({ contest, date, sides }) => ({ contest, date, sides }));
};

/** Events with their results, squads and final lineups (entries without an event belong to a single-event edition). */
export const editionEvents = (
  events: readonly EventRow[],
  data: { entries: readonly EntryRow[]; results: readonly ResultRow[]; members: readonly MemberRow[]; lineups: readonly LineupRow[] },
  nations: ReadonlyMap<string, NationRef>,
): EditionEvent[] => {
  const entryById = new Map(data.entries.map((e) => [e.entryId, e]));
  const single = events.length === 1 ? events[0]!.id : null;
  return events.map((ev) => {
    const entries = data.entries.filter((e) => (e.eventId ?? single) === ev.id);
    const results = data.results
      .filter((r) => r.eventId === ev.id && entryById.has(r.entryId))
      .map((r) => ({ rank: r.rank, tied: r.tied, status: r.status, competitor: competitorRef(entryById.get(r.entryId)!, nations), mark: r.mark }));
    return {
      id: ev.id,
      label: ev.label,
      category: ev.category,
      results,
      squads: squadsOf(entries, data.members, nations),
      lineups: lineupsOf(
        data.lineups.filter((l) => l.eventId === ev.id),
        entryById,
        nations,
      ),
    };
  });
};
