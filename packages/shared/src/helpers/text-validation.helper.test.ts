import { describe, expect, it } from 'vitest';

import { BANNED_WORDS_FIXTURE } from '../test/moderation.fixture';
import { hasBannedWord } from './banned-words.helper';
import { validateComment } from './text-validation.helper';

const check = (body: string) => validateComment(body, BANNED_WORDS_FIXTURE);

describe('validateComment (doc 20)', () => {
  it.each(['', '   ', '\n\n  \t', '   　', '​‌‍⁠﻿'])('refuses empty-ish body %j', (body) => {
    expect(check(body)).toMatchObject({ ok: false, error: 'empty' });
  });

  it('accepts 500 code points and refuses 501', () => {
    expect(check('a'.repeat(500)).ok).toBe(true);
    expect(check('a'.repeat(501))).toMatchObject({ ok: false, error: 'too_long', length: 501 });
    expect(check(`  ${'🏆'.repeat(500)}  `).ok).toBe(true);
  });

  it.each(['p0rra', 'M3RDAAA', 'FILHO DA PUTA', 'caralhooo', 'que merdaço', 'ARROMBADOS', 'f*ck fuckers'])('refuses banned %j', (body) => {
    const result = check(body);
    expect(result).toMatchObject({ ok: false, error: 'banned_word' });
    if (!result.ok) expect(result.message).not.toMatch(/porra|merda|puta|caralho|arrombado|fuck/i);
  });

  it.each(['Disputa acirrada', 'Computador', 'Que jogador!', 'Putative evidence? no: imputar'])('accepts %j', (body) => {
    expect(check(body).ok).toBe(true);
  });

  it('returns the cleaned text and its length', () => {
    expect(check('  Três Copas!  ')).toEqual({ ok: true, text: 'Três Copas!', length: 11 });
  });

  it('word mode needs the whole expression; contains mode matches inside words', () => {
    expect(hasBannedWord('filho da', BANNED_WORDS_FIXTURE)).toBe(false);
    expect(hasBannedWord('shitake', BANNED_WORDS_FIXTURE)).toBe(false);
    expect(hasBannedWord('mierdoso', BANNED_WORDS_FIXTURE)).toBe(false);
    expect(hasBannedWord('mierdaa', BANNED_WORDS_FIXTURE)).toBe(true);
  });
});
