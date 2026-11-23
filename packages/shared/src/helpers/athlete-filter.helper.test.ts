import { describe, expect, it } from 'vitest';

import type { AthleteSummary } from '../types/athlete-summary.type';
import { matchesAthleteFilters } from './athlete-filter.helper';

const pele = {
  slug: 'pele',
  knownAs: 'Pelé',
  tier: 'mythic',
  sport: { slug: 'futebol', groupSlug: 'fisico' },
  nationalities: [{ iso2: 'BR', flag: '🇧🇷', name: 'Brasil' }],
} as unknown as AthleteSummary;
const names = ['Pelé', 'Edson Arantes do Nascimento', 'O Rei'];

describe('matchesAthleteFilters', () => {
  it('searches names without accents/case', () => {
    expect(matchesAthleteFilters(pele, { q: 'PELE' }, names)).toBe(true);
    expect(matchesAthleteFilters(pele, { q: 'rei' }, names)).toBe(true);
    expect(matchesAthleteFilters(pele, { q: 'tyson' }, names)).toBe(false);
  });
  it('combines sport, tier, group and country', () => {
    expect(matchesAthleteFilters(pele, { sport: 'futebol', tier: 'mythic', group: 'fisico', country: 'br' })).toBe(true);
    expect(matchesAthleteFilters(pele, { tier: 'elite' })).toBe(false);
    expect(matchesAthleteFilters(pele, { country: 'AR' })).toBe(false);
  });
});
