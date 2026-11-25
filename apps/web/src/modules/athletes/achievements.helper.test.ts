import type { Achievement, AchievementType, CompetitionLevel } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { groupTitlesByCompetition } from './achievements.helper';

const result = (id: string, slug: string, type: AchievementType, year: number, level: CompetitionLevel = 'world'): Achievement => ({
  id,
  kind: 'competition',
  type,
  weight: 1,
  year,
  date: null,
  level,
  levelWeight: 1,
  rank: null,
  source: null,
  competition: { slug, name: slug.toUpperCase() },
  edition: { label: String(year), number: null, host: null },
  isOlympic: false,
  category: null,
  team: null,
});

describe('groupTitlesByCompetition (T4.3)', () => {
  it('keeps titles and medals only, grouped by competition (world first) and split by result type in display order', () => {
    const groups = groupTitlesByCompetition([
      result('1', 'copa', 'champion', 1997, 'continental'),
      result('2', 'olympics', 'bronze', 2000),
      result('3', 'olympics', 'gold', 2008),
      result('4', 'olympics', 'gold', 2004),
      result('5', 'olympics', 'runner_up', 2012),
      result('6', 'olympics', 'silver', 2016),
    ]);
    expect(groups.map((g) => g.key)).toEqual(['olympics', 'copa']);
    expect(groups[0]?.kinds.map((k) => [k.type, k.items.map((i) => i.year)])).toEqual([
      ['gold', [2004, 2008]],
      ['silver', [2016]],
      ['bronze', [2000]],
    ]);
    expect(groups[1]?.kinds.map((k) => k.type)).toEqual(['champion']);
  });

  it('is empty without titles or medals', () => {
    expect(groupTitlesByCompetition([result('1', 'x', 'runner_up', 2001)])).toEqual([]);
  });
});
