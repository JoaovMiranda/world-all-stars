import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import type { ChessConfig } from './chess-config.type';

/** A counted title needs a known time control; the evidence may omit the format (classical by default). */
export const chessTitleFormat = (e: RankingEvidence): string | null =>
  e.kind === 'chess_title' ? String(e.attributes.format ?? 'classical') : null;

/** Evidence of one ranking scope: everything for the overall list, only the format (or format-agnostic rows) otherwise. */
export const chessInScope = (e: RankingEvidence, format: string | null) => format === null || e.attributes.format === format || e.attributes.format == null;

/** Title points by time control, peak-rating bonus and years as world number one (METHODOLOGY.md). */
export const computeChessScore = (list: RankingEvidence[], config: ChessConfig, format: string | null = null) => {
  const scoped = list.filter((e) => chessInScope(e, format));
  const titles = (timeControl: string) => scoped.filter((e) => chessTitleFormat(e) === timeControl).length;
  const items: { evidenceId: string; contribution: number; note: string | null }[] = [];
  const titlePoints = (rows: RankingEvidence[], timeControl: string, points: number) => {
    for (const e of rows) items.push({ evidenceId: e.id, contribution: points, note: `${timeControl} world title ${e.attributes.year}` });
  };
  titlePoints(
    scoped.filter((e) => chessTitleFormat(e) === 'classical'),
    'classical',
    config.classicalTitlePoints,
  );
  titlePoints(
    scoped.filter((e) => chessTitleFormat(e) === 'rapid'),
    'rapid',
    config.rapidTitlePoints,
  );
  titlePoints(
    scoped.filter((e) => chessTitleFormat(e) === 'blitz'),
    'blitz',
    config.blitzTitlePoints,
  );
  const ratings = scoped.filter((e) => e.kind === 'chess_rating');
  const peak = ratings.length ? Math.max(...ratings.map((e) => Number(e.attributes.rating))) : 0;
  const ratingPoints = Math.max(0, (peak - config.ratingBase) / config.ratingDivisor);
  if (ratingPoints > 0 && ratings.length) items.push({ evidenceId: ratings[0]!.id, contribution: ratingPoints, note: `peak rating ${peak}` });
  const numberOneYears = new Set(scoped.filter((e) => e.kind === 'chess_number_one').map((e) => String(e.attributes.year))).size;
  const numberOneRows = scoped.filter((e) => e.kind === 'chess_number_one');
  if (numberOneYears > 0) items.push({ evidenceId: numberOneRows[0]!.id, contribution: numberOneYears * config.numberOneYearPoints, note: `${numberOneYears} years as #1` });
  return {
    score: items.reduce((sum, item) => sum + item.contribution, 0),
    items,
    metrics: {
      classicalTitles: titles('classical'),
      rapidTitles: titles('rapid'),
      blitzTitles: titles('blitz'),
      peakRating: peak,
      yearsAsNumberOne: numberOneYears,
    },
  };
};
