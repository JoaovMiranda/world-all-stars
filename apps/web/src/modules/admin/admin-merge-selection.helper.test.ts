import { describe, expect, it } from 'vitest';

import {
  chooseMergeField,
  emptyMergeSelection,
  isMergeReady,
  mergeRequestOf,
  mergeWinnerOf,
  pickMergeSide,
  swapMergeSides,
} from './admin-merge-selection.helper';

const pele = { id: 'a', slug: 'pele', name: 'Pelé' };
const edson = { id: 'b', slug: 'edson', name: 'Edson Arantes' };
const third = { id: 'c', slug: 'third', name: 'Third' };

describe('merge selection state', () => {
  it('starts empty and is ready only with two different sides', () => {
    const empty = emptyMergeSelection();
    expect(isMergeReady(empty)).toBe(false);
    const one = pickMergeSide(empty, 'survivor', pele);
    expect(isMergeReady(one)).toBe(false);
    expect(isMergeReady(pickMergeSide(one, 'merged', edson))).toBe(true);
  });

  it('defaults every field to the survivor and records explicit winners', () => {
    let s = pickMergeSide(pickMergeSide(emptyMergeSelection(), 'survivor', pele), 'merged', edson);
    expect(mergeWinnerOf(s, 'fullName')).toBe('survivor');
    s = chooseMergeField(s, 'fullName', 'merged');
    s = chooseMergeField(s, 'slug', 'survivor');
    expect(mergeWinnerOf(s, 'fullName')).toBe('merged');
    expect(mergeWinnerOf(s, 'slug')).toBe('survivor');
  });

  it('picking the entity of the other side swaps the sides', () => {
    const s = pickMergeSide(pickMergeSide(pickMergeSide(emptyMergeSelection(), 'survivor', pele), 'merged', edson), 'survivor', edson);
    expect(s.survivor?.id).toBe('b');
    expect(s.merged?.id).toBe('a');
  });

  it('changing a side resets the field choices', () => {
    const s = chooseMergeField(pickMergeSide(pickMergeSide(emptyMergeSelection(), 'survivor', pele), 'merged', edson), 'slug', 'merged');
    expect(pickMergeSide(s, 'merged', third).choices).toEqual({});
    expect(pickMergeSide(s, 'merged', null).merged).toBeNull();
  });

  it('swap keeps each chosen value chosen', () => {
    const s = chooseMergeField(pickMergeSide(pickMergeSide(emptyMergeSelection(), 'survivor', pele), 'merged', edson), 'slug', 'merged');
    const swapped = swapMergeSides(s);
    expect(swapped.survivor?.id).toBe('b');
    expect(mergeWinnerOf(swapped, 'slug')).toBe('survivor');
    expect(mergeWinnerOf(swapped, 'fullName')).toBe('survivor');
  });

  it('builds the request with only the fields B wins', () => {
    let s = pickMergeSide(pickMergeSide(emptyMergeSelection(), 'survivor', pele), 'merged', edson);
    s = chooseMergeField(chooseMergeField(s, 'slug', 'merged'), 'knownAs', 'survivor');
    if (!isMergeReady(s)) throw new Error('not ready');
    expect(mergeRequestOf(s, 'same person')).toEqual({ survivorId: 'a', mergedId: 'b', reason: 'same person', fieldChoices: { slug: 'merged' } });
  });
});
