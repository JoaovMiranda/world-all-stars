import { describe, expect, it } from 'vitest';

import { isFreeLicense } from './free-license.helper';

describe('isFreeLicense', () => {
  it('accepts CC0, public domain, CC BY and CC BY-SA (any version or port)', () => {
    for (const l of [
      'CC0',
      'CC0 1.0',
      'Public domain',
      'PD',
      'PD-US',
      'Public Domain Mark 1.0',
      'CC BY 2.0',
      'CC BY-SA 4.0',
      'CC BY-SA 3.0 de',
      'cc-by-sa-2.5',
      'CC BY-SA',
      'Domínio público',
      'Dominio público',
    ])
      expect(isFreeLicense(l), l).toBe(true);
  });

  it('refuses non-commercial, no-derivatives, GFDL-only, fair use and unknown licenses', () => {
    for (const l of ['CC BY-NC 2.0', 'CC BY-NC-SA 4.0', 'CC BY-ND 4.0', 'GFDL', 'Fair use', 'All rights reserved', '', null, undefined])
      expect(isFreeLicense(l), String(l)).toBe(false);
  });

  it('ignores markup and a trailing "license"', () => {
    expect(isFreeLicense('<a href="x">CC BY-SA 4.0</a>')).toBe(true);
    expect(isFreeLicense('CC BY 4.0 license')).toBe(true);
  });
});
