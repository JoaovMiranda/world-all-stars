import { describe, expect, it } from 'vitest';

import type { RankingEntryFacts } from './ranking-entry-facts.interface';
import type { RankingItemFact } from './ranking-item-fact.interface';
import { activeRankingFilters, matchesRankingFilters, rankingFilterOptions } from './ranking-filters.helper';

const brazil = { value: 'br', ioc: 'BRA', codes: ['br', 'bra'], name: 'Brazil' };
const usa = { value: 'us', ioc: 'USA', codes: ['us', 'usa'], name: 'United States' };

const item = (over: Partial<RankingItemFact> = {}): RankingItemFact => ({
  competition: 'adcc',
  competitionName: 'ADCC',
  organization: 'adcc',
  organizationName: 'ADCC',
  edition: 2019,
  sport: 'jiu-jitsu',
  sportName: 'Jiu-Jitsu',
  position: null,
  positionName: null,
  country: null,
  categories: [],
  ...over,
});
const cat = (dimension: string, slug: string, label = slug) => ({ dimension, slug, label });

const bjjA: RankingEntryFacts = {
  gender: 'male',
  countries: [brazil],
  positions: [],
  items: [
    item({ categories: [cat('sex_category', 'men'), cat('gi_mode', 'no-gi'), cat('weight', '-77-kg', '-77 kg')] }),
    item({
      competition: 'ibjjf-world-championship',
      organization: 'ibjjf',
      organizationName: 'IBJJF',
      edition: 2018,
      categories: [cat('sex_category', 'men'), cat('gi_mode', 'gi'), cat('belt', 'black'), cat('weight', 'open-class', 'Open Class')],
    }),
  ],
};
const bjjB: RankingEntryFacts = {
  gender: 'female',
  countries: [usa],
  positions: [],
  items: [item({ categories: [cat('sex_category', 'women'), cat('gi_mode', 'no-gi'), cat('weight', '-60-kg', '-60 kg')] })],
};
const footballer: RankingEntryFacts = {
  gender: 'male',
  countries: [],
  positions: ['defender'],
  items: [item({ competition: 'fifa-world-cup', organization: 'fifa', edition: 2002, sport: 'football', position: 'df', country: brazil })],
};

describe('activeRankingFilters', () => {
  it('keeps only the keys of the methodology', () => {
    expect(activeRankingFilters('bjj-career', { gi: 'gi', edition: 2002, belt: undefined })).toEqual({ gi: 'gi' });
    expect(activeRankingFilters('football-champions', { gi: 'gi', edition: 2002 })).toEqual({ edition: 2002 });
    expect(activeRankingFilters('unknown', { gi: 'gi' })).toEqual({});
  });
});

describe('matchesRankingFilters', () => {
  it('BJJ: evidence filters must hold on the same result', () => {
    expect(matchesRankingFilters(bjjA, { gi: 'no-gi', weight: '-77 kg' })).toBe(true);
    expect(matchesRankingFilters(bjjA, { gi: 'gi', weight: '-77-kg' })).toBe(false);
    expect(matchesRankingFilters(bjjA, { belt: 'black', organization: 'ibjjf' })).toBe(true);
    expect(matchesRankingFilters(bjjA, { absolute: true })).toBe(true);
    expect(matchesRankingFilters(bjjB, { absolute: true })).toBe(false);
    expect(matchesRankingFilters(bjjB, { absolute: false, sex: 'women' })).toBe(true);
    expect(matchesRankingFilters(bjjB, { sex: 'men' })).toBe(false);
  });

  it('country matches any code of the competitor or of the entry it was counted in', () => {
    expect(matchesRankingFilters(bjjA, { country: 'BR' })).toBe(true);
    expect(matchesRankingFilters(bjjA, { country: 'us' })).toBe(false);
    expect(matchesRankingFilters(footballer, { nationality: 'bra' })).toBe(true);
    expect(matchesRankingFilters(footballer, { noc: 'BRA', edition: 2002, competition: 'fifa-world-cup' })).toBe(true);
  });

  it('football: gender, edition and position', () => {
    expect(matchesRankingFilters(footballer, { gender: 'men', edition: 2002 })).toBe(true);
    expect(matchesRankingFilters(footballer, { gender: 'women' })).toBe(false);
    expect(matchesRankingFilters(footballer, { edition: 1994 })).toBe(false);
    expect(matchesRankingFilters(footballer, { position: 'defender' })).toBe(true);
    expect(matchesRankingFilters(footballer, { position: 'df' })).toBe(true);
  });

  it('no filter matches everything', () => {
    expect(matchesRankingFilters(bjjB, {})).toBe(true);
  });
});

describe('rankingFilterOptions', () => {
  it('lists the methodology filters with the values present in the snapshot', () => {
    const { filters } = rankingFilterOptions('bjj-career', [bjjA, bjjB], 'en');
    const of = (key: string) => filters.find((f) => f.key === key)?.options.map((o) => o.value);
    expect(filters.map((f) => f.key)).toEqual(['sex', 'gi', 'belt', 'weight', 'absolute', 'country', 'organization']);
    expect(of('sex')).toEqual(['men', 'women']);
    expect(of('gi')).toEqual(['gi', 'no-gi']);
    expect(of('belt')).toEqual(['black']);
    expect(of('absolute')).toEqual(['true', 'false']);
    expect(of('country')).toEqual(['br', 'us']);
    expect(of('organization')).toEqual(['adcc', 'ibjjf']);
  });

  it('football editions newest first', () => {
    const older = { ...footballer, items: [item({ competition: 'fifa-world-cup', edition: 1994 })] };
    const { filters } = rankingFilterOptions('football-champions', [older, footballer], 'en');
    expect(filters.find((f) => f.key === 'edition')?.options.map((o) => o.value)).toEqual(['2002', '1994']);
  });
});
