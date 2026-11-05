import { describe, expect, it } from 'vitest';

import { officialTierChangeError, reviewDossierOutcome } from './tier-rules.helper';

describe('officialTierChangeError', () => {
  it('refuses Mythic without an approved dossier', () => {
    expect(officialTierChangeError({ current: 'legendary', target: 'mythic', dossierStatus: 'pending' })?.error).toBe('dossier_required');
    expect(officialTierChangeError({ current: 'legendary', target: 'mythic', dossierStatus: null })?.error).toBe('dossier_required');
    expect(officialTierChangeError({ current: 'legendary', target: 'mythic', dossierStatus: 'approved' })).toBeNull();
  });
  it('refuses the same tier', () => {
    expect(officialTierChangeError({ current: 'elite', target: 'elite', dossierStatus: null })?.error).toBe('same_tier');
  });
});

describe('reviewDossierOutcome', () => {
  const pending = { status: 'pending' as const, approvedBy: ['Ana'], approvalsRequired: 2 };
  it('publishes with a second, different admin', () => {
    expect(reviewDossierOutcome(pending, 'approve', 'Bia')).toEqual({ ok: true, status: 'approved', approvedBy: ['Ana', 'Bia'] });
  });
  it('refuses a second approval by the same admin', () => {
    expect(reviewDossierOutcome(pending, 'approve', 'Ana').ok).toBe(false);
  });
  it('refuses decided dossiers and rejects otherwise', () => {
    expect(reviewDossierOutcome({ ...pending, status: 'approved' }, 'reject', 'Bia').ok).toBe(false);
    expect(reviewDossierOutcome(pending, 'reject', 'Bia')).toMatchObject({ ok: true, status: 'rejected' });
  });
});
