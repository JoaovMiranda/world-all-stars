import type { RankingDefinition } from '../../core/ranking-definition.interface';

/** Overall ranking plus one ranking per configured format (config.formats); classical is always present. */
export const chessRankings = (formats: string[]): RankingDefinition[] => [
  { key: 'overall', title: 'Chess — all time controls', scope: { format: null } },
  ...['classical', ...formats.filter((f) => f !== 'classical')].map((format) => ({ key: `format-${format}`, title: `Chess — ${format}`, scope: { format } })),
];

export const CHESS_TITLE_FORMATS = ['classical', 'rapid', 'blitz'] as const;
