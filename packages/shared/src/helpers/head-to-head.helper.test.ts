import { describe, expect, it } from 'vitest';

import type { HeadToHeadInput } from '../interfaces/head-to-head-input.interface';
import { HeadToHeadResponseSchema } from '../schemas/head-to-head.schema';
import type { AthleteProfile } from '../types/athlete-profile.type';
import { composeHeadToHead } from './head-to-head.helper';

const source = { slug: 'wikipedia', name: 'Wikipedia', license: 'CC BY-SA 4.0', url: 'https://en.wikipedia.org/wiki/X', home: 'https://wikipedia.org' };

const side = (slug: string, sport: string, types: string[], rankings: HeadToHeadInput['rankings'] = []): HeadToHeadInput => ({
  profile: {
    id: `id-${slug}`,
    slug,
    knownAs: slug,
    tier: 'elite',
    percentile: 50,
    photo: null,
    sport: {
      id: sport,
      slug: sport,
      name: sport,
      colorToken: 'primary',
      statsSchema: sport,
      group: 'g',
      groupSlug: 'g',
      subgroup: 's',
      environment: 'e',
      format: 'f',
      governance: null,
    },
    nationalities: [],
    careerFrom: null,
    careerTo: null,
    status: 'retired',
    titles: 0,
    worldTitles: 0,
    isHallOfGreats: false,
    achievements: types.map((type, i) => ({ id: `${slug}-${i}`, type })),
    sourceLinks: [source, source],
  } as unknown as AthleteProfile,
  band: { slug, rulesetVersion: 'cross-sport@1', outputHash: 'h', band: 'S', points: 10, items: [], pendingReview: 0 },
  legacy: { slug, rulesetVersion: 'legacy@1', level: 'L2', score: 12, accepted: [], excluded: [], dossierStatus: null, l5Threshold: 100, explanation: 'x' },
  rankings,
});

const ranked = (snapshotId: string, rank: number) => ({
  snapshotId,
  title: `Ranking ${snapshotId}`,
  rank,
  rankTied: false,
  score: 100 - rank,
  rankingKey: snapshotId,
});

describe('composeHeadToHead', () => {
  it('counts titles by kind, dedupes sources and returns a valid response', () => {
    const r = composeHeadToHead(side('a', 'football', ['champion', 'champion', 'gold']), side('b', 'swimming', ['gold']), new Map());
    expect(r.a.titles).toEqual([
      { type: 'champion', count: 2 },
      { type: 'gold', count: 1 },
    ]);
    expect(r.a.sources).toHaveLength(1);
    expect(HeadToHeadResponseSchema.safeParse(r).success).toBe(true);
  });

  it('never sets methodology scores against each other across sports', () => {
    const snapshots = new Map([
      ['s1', 'football'],
      ['s2', 'swimming'],
    ]);
    const r = composeHeadToHead(side('a', 'football', [], [ranked('s1', 1)]), side('b', 'swimming', [], [ranked('s2', 1)]), snapshots);
    expect(r.sharedSports).toEqual([]);
    expect(r.methodology).toEqual([]);
  });

  it('lists the shared-sport rankings with both positions (null when one is not ranked)', () => {
    const snapshots = new Map([
      ['s1', 'football'],
      ['s3', 'football'],
    ]);
    const r = composeHeadToHead(side('a', 'football', [], [ranked('s1', 1), ranked('s3', 4)]), side('b', 'football', [], [ranked('s1', 2)]), snapshots);
    expect(r.sharedSports.map((s) => s.slug)).toEqual(['football']);
    expect(r.methodology.map((m) => [m.snapshotId, m.a?.rank ?? null, m.b?.rank ?? null])).toEqual([
      ['s1', 1, 2],
      ['s3', 4, null],
    ]);
  });
});
