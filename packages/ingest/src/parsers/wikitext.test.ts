import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { bjjChampions, finalStarters, infoboxWinner, linkOrText, olympicGolds, toIoc, wikitableCells } from './wikitext';

const CACHE = path.resolve(import.meta.dirname, '../../../../data/seeds/.cache/wiki');
const page = (name: string) => (fs.existsSync(path.join(CACHE, name)) ? fs.readFileSync(path.join(CACHE, name), 'utf8') : null);

describe('wikitext parsers (port of crawl_athletes.py)', () => {
  it('reads links, sortname and plain text cells', () => {
    expect(linkOrText("[[File:Flag.svg|x]] [[Mark Kerr (fighter)|Mark Kerr]] <small>(1/3)</small>")).toEqual(['Mark Kerr', 'Mark Kerr (fighter)']);
    expect(linkOrText('{{sortname|Rodri|Hernández|Rodri (footballer, born 1996)}}')).toEqual(['Rodri Hernández', 'Rodri (footballer, born 1996)']);
    expect(linkOrText("'''Marcos Barreto'''")).toEqual(['Marcos Barreto', null]);
  });

  it('maps FIFA/old codes and names to IOC codes', () => {
    expect(toIoc('SPA')).toBe('ESP');
    expect(toIoc('Soviet Union')).toBe('URS');
  });

  it('keeps the year and the division header of every table cell', () => {
    const text = "=== Men ===\n{|\n|-\n! Year !! 66&nbsp;kg !! Absolute\n|-\n| 1998 || [[A B]] <small>(1/1)</small> || [[C D]] <small>(1/2)</small>\n|}\n=== Women ===\n==== 2005 ====\n{|\n! 60 kg\n|-\n| [[E F]] <small>(1/1)</small>\n|}";
    const champions = bjjChampions(text, /^=== Men/m, /^=== Nothing/m);
    expect(champions).toEqual([
      { name: 'A B', link: 'A B', gender: 'men', year: 1998, division: '66 kg' },
      { name: 'C D', link: 'C D', gender: 'men', year: 1998, division: 'Absolute' },
      { name: 'E F', link: 'E F', gender: 'women', year: 2005, division: '60 kg' },
    ]);
    expect(wikitableCells(text).length).toBeGreaterThan(0);
  });

  it.skipIf(!page('ADCC_Submission_Fighting_World_Championship.wiki'))('ADCC page: every champion has a year and a division (parity: 78 athletes)', () => {
    const adcc = bjjChampions(page('ADCC_Submission_Fighting_World_Championship.wiki')!, /^=== List of ADCC Champions in Men/m, /^=== List of winners by total titles/m);
    expect(adcc.length).toBeGreaterThanOrEqual(130);
    expect(adcc.every((c) => c.year && c.division)).toBe(true);
    expect(new Set(adcc.map((c) => c.link ?? c.name)).size).toBe(78);
    expect(adcc.find((c) => c.name === 'Roger Gracie' && c.year === 2005)?.division).toMatch(/99|Absolute/);
    expect(adcc.some((c) => c.gender === 'women')).toBe(true);
  });

  it.skipIf(!page('World_IBJJF_Jiu-Jitsu_Championship.wiki'))('IBJJF page: black-belt champions with year and weight', () => {
    const ibjjf = bjjChampions(page('World_IBJJF_Jiu-Jitsu_Championship.wiki')!, /^=== Men's black belt world champions/m, /^== List of winners by total titles/m);
    expect(ibjjf.length).toBeGreaterThanOrEqual(450);
    expect(ibjjf.filter((c) => !c.year).length).toBe(0);
    expect(ibjjf.find((c) => c.year === 1996)?.division).toBe('57 kg');
  });

  it.skipIf(!page('2026_FIFA_World_Cup_final.wiki'))('2026 final: winner from the infobox and its 11 starters', () => {
    const final = page('2026_FIFA_World_Cup_final.wiki')!;
    const winner = infoboxWinner(final);
    expect(winner).toBe('Spain');
    expect(finalStarters(final, [winner!])).toHaveLength(11);
  });

  it.skipIf(!page('Football_at_the_Summer_Olympics.wiki'))('Olympic finals table: one champion per edition', () => {
    const golds = olympicGolds(page('Football_at_the_Summer_Olympics.wiki')!);
    expect(golds.get('Men:2024')).toBe('ESP');
    expect(golds.get('Women:2024')).toBe('USA');
    expect(golds.size).toBeGreaterThanOrEqual(33);
  });
});
