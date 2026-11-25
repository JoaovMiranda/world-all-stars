import type { EditionEvent, MedalTableRow } from '../types/competition-page.type';

/** Fields that identify an edition inside its competition. */
type EditionKeySource = { id: string; year: number | null; number: number | null; startDate?: string | null };

const byChronology = (a: EditionKeySource, b: EditionKeySource) =>
  (a.year ?? Number.MAX_SAFE_INTEGER) - (b.year ?? Number.MAX_SAFE_INTEGER) ||
  (a.number ?? 0) - (b.number ?? 0) ||
  (a.startDate ?? '').localeCompare(b.startDate ?? '') ||
  a.id.localeCompare(b.id);

/**
 * URL keys of the editions of ONE competition (`/competitions/<competition>/<key>`): the year; a repeated year gets
 * `-2`, `-3`… in chronological order; editions without a year use `edition-<number>` (or their id). Deterministic for
 * the same set of editions, so the server, the sitemap and the links agree.
 */
export const editionKeys = (editions: readonly EditionKeySource[]): Map<string, string> => {
  const keys = new Map<string, string>();
  const used = new Map<string, number>();
  for (const e of [...editions].sort(byChronology)) {
    const base = e.year !== null ? String(e.year) : e.number !== null ? `edition-${e.number}` : e.id;
    const n = (used.get(base) ?? 0) + 1;
    used.set(base, n);
    keys.set(e.id, n === 1 ? base : `${base}-${n}`);
  }
  return keys;
};

/** Site path of a competition page. */
export const competitionPath = (competition: string): string => `/competitions/${encodeURIComponent(competition)}`;

/** Site path of an edition page. */
export const competitionEditionPath = (competition: string, edition: string): string => `${competitionPath(competition)}/${encodeURIComponent(edition)}`;

const MEDAL_OF_RANK = ['gold', 'silver', 'bronze'] as const;

/**
 * Medal table of an edition by represented nation (podium places of every event; ties count for each entry). Empty
 * unless more than one event awarded podium places: a single-event edition shows its results instead.
 */
export const medalTable = (events: readonly Pick<EditionEvent, 'results'>[]): MedalTableRow[] => {
  const podiumEvents = events.filter((e) => e.results.some((r) => r.rank !== null && r.rank <= 3));
  if (podiumEvents.length < 2) return [];
  const rows = new Map<string, MedalTableRow>();
  for (const e of podiumEvents)
    for (const r of e.results) {
      const medal = r.rank !== null ? MEDAL_OF_RANK[r.rank - 1] : undefined;
      const nation = r.competitor.nation;
      if (!medal || !nation) continue;
      const row = rows.get(nation.code) ?? { nation, gold: 0, silver: 0, bronze: 0, total: 0 };
      row[medal] += 1;
      row.total += 1;
      rows.set(nation.code, row);
    }
  return [...rows.values()].sort((a, b) => b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || a.nation.name.localeCompare(b.nation.name));
};
