// Every registered methodology has a recorded golden (T2.3): the publication gate must never pass on an unknown ruleset.
import { describe, expect, it } from 'vitest';

import { GOLDEN_HASHES, GOLDEN_INPUTS } from './goldens.const';
import { METHODOLOGIES } from './registry.const';
import { verifyGoldens } from './verify-goldens.helper';

describe('methodology goldens', () => {
  it('every registered methodology has a fixture and a recorded hash', () => {
    for (const key of Object.keys(METHODOLOGIES)) {
      expect(GOLDEN_INPUTS[key], `${key} fixture`).toBeDefined();
      expect(GOLDEN_HASHES[key], `${key} hash`).toBeDefined();
    }
  });

  it('each golden reproduces exactly', () => {
    for (const key of Object.keys(METHODOLOGIES)) expect(verifyGoldens(key), key).toMatchObject({ ok: true });
  });

  it('an unknown methodology never passes the gate', () => {
    expect(verifyGoldens('nope')).toMatchObject({ ok: false, actual: null });
  });
});
