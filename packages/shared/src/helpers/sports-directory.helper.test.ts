import { describe, expect, it } from 'vitest';

import type { OrgTreeNode } from '../types/organization.type';
import type { SportCompetition } from '../types/sport-page.type';
import type { SportCard, SportGroup } from '../types/sports-tree.type';
import {
  countOrgTree,
  countSports,
  featuredAssociations,
  filterOrgTree,
  filterSportsTree,
  matchesCompetitionFilters,
  matchesSportSearch,
} from './sports-directory.helper';

const org = (name: string, governs: boolean) => ({ name, governs });
const sport = (name: string, governance: SportCard['governance'], orgs: string[]) =>
  ({ name, group: 'Físico', subgroup: 'Combate', governance, associations: orgs.map((o) => ({ name: o })) }) as SportCard;
const tree: SportGroup[] = [
  {
    slug: 'fisico',
    name: 'Físico',
    subgroups: [{ slug: 'combate', name: 'Combate', sports: [sport('MMA', 'free_market', ['UFC', 'PFL']), sport('Boxe', 'condominium', ['WBC'])] }],
  },
  { slug: 'mental', name: 'Mental', subgroups: [{ slug: 'tabuleiro', name: 'Tabuleiro', sports: [sport('Xadrez', 'pyramid', ['FIDE'])] }] },
];
const node = (name: string, nature: OrgTreeNode['nature'], children: OrgTreeNode[] = []) => ({ name, nature, children }) as unknown as OrgTreeNode;

describe('sports directory helpers', () => {
  it('features the governing associations first, up to the limit', () => {
    expect(featuredAssociations([org('A', true), org('B', false), org('C', true)], 5).map((o) => o.name)).toEqual(['A', 'C']);
    expect(featuredAssociations([org('A', false), org('B', false)], 1).map((o) => o.name)).toEqual(['A']);
  });
  it('searches sports by name or association, ignoring accents', () => {
    expect(matchesSportSearch(tree[0]!.subgroups[0]!.sports[0]!, 'ufc')).toBe(true);
    expect(matchesSportSearch(tree[1]!.subgroups[0]!.sports[0]!, 'XADREZ')).toBe(true);
    expect(matchesSportSearch(tree[1]!.subgroups[0]!.sports[0]!, 'ufc')).toBe(false);
    expect(matchesSportSearch(tree[1]!.subgroups[0]!.sports[0]!, '')).toBe(true);
  });
  it('prunes empty subgroups and groups', () => {
    const byUfc = filterSportsTree(tree, { q: 'UFC' });
    expect(byUfc.map((g) => g.slug)).toEqual(['fisico']);
    expect(countSports(byUfc)).toBe(1);
    expect(countSports(filterSportsTree(tree, { governance: 'pyramid' }))).toBe(1);
    expect(countSports(filterSportsTree(tree, {}))).toBe(3);
  });
  it('filters the org hierarchy by nature keeping the ancestors', () => {
    const orgs = [node('COI', 'association', [node('FIFA', 'association', [node('LaLiga', 'company')])]), node('Riot', 'company'), node('ONG', 'community')];
    expect(countOrgTree(orgs)).toBe(5);
    const companies = filterOrgTree(orgs, 'company');
    expect(companies.map((n) => n.name)).toEqual(['COI', 'Riot']);
    expect(countOrgTree(companies)).toBe(4);
    expect(filterOrgTree(orgs, undefined)).toHaveLength(3);
  });
  it('filters competitions by level and text', () => {
    const c = { name: 'Copa do Mundo', org: 'FIFA', level: 'world' } as SportCompetition;
    expect(matchesCompetitionFilters(c, { level: 'world', q: 'fifa' })).toBe(true);
    expect(matchesCompetitionFilters(c, { level: 'national' })).toBe(false);
    expect(matchesCompetitionFilters(c, { q: 'copa' })).toBe(true);
  });
});
