import { describe, expect, it } from 'vitest';

import { isCommentFlagged, isDossierApproved, privacyDeadlineOf, privacyDueAt, tierSignalOf } from './admin-rules.helper';

describe('tierSignalOf', () => {
  it('fires with ≥ 30 votes and > 60 % for another tier', () => {
    const r = tierSignalOf({ mythic: 25, legendary: 5 }, 'legendary');
    expect(r).toMatchObject({ topOther: 'mythic', mostVoted: 'mythic', isSignal: true });
  });
  it('does not fire below the minimum votes', () => {
    expect(tierSignalOf({ mythic: 20, legendary: 2 }, 'legendary').isSignal).toBe(false);
  });
  it('does not fire without a clear majority', () => {
    expect(tierSignalOf({ mythic: 18, legendary: 14 }, 'legendary').isSignal).toBe(false);
  });
  it('handles no votes', () => {
    expect(tierSignalOf({}, 'elite')).toEqual({ topOther: null, topOtherShare: 0, mostVoted: null, isSignal: false });
  });
  it('keeps the official tier on ties', () => {
    expect(tierSignalOf({ mythic: 9, legendary: 9 }, 'legendary').mostVoted).toBe('legendary');
  });
});

describe('isCommentFlagged', () => {
  it('flags visible comments with many dislikes only', () => {
    expect(isCommentFlagged({ status: 'visible', dislikes: 5 })).toBe(true);
    expect(isCommentFlagged({ status: 'visible', dislikes: 4 })).toBe(false);
    expect(isCommentFlagged({ status: 'hidden', dislikes: 50 })).toBe(false);
  });
});

describe('privacy deadline', () => {
  const createdAt = '2026-11-01T12:00:00.000Z';
  const dueAt = privacyDueAt(createdAt);
  it('adds the legal window', () => expect(dueAt).toBe('2026-11-16T12:00:00.000Z'));
  it('classifies open requests', () => {
    expect(privacyDeadlineOf({ status: 'open', dueAt }, new Date('2026-11-02T12:00:00Z')).state).toBe('on_track');
    expect(privacyDeadlineOf({ status: 'open', dueAt }, new Date('2026-11-14T12:00:00Z')).state).toBe('due_soon');
    expect(privacyDeadlineOf({ status: 'in_progress', dueAt }, new Date('2026-11-20T12:00:00Z')).state).toBe('overdue');
  });
  it('never marks answered requests as late', () => {
    expect(privacyDeadlineOf({ status: 'answered', dueAt }, new Date('2026-12-20T12:00:00Z')).state).toBe('closed');
  });
});

describe('isDossierApproved', () => {
  it('needs two different admins', () => {
    expect(isDossierApproved(['a'])).toBe(false);
    expect(isDossierApproved(['a', 'a'])).toBe(false);
    expect(isDossierApproved(['a', 'b'])).toBe(true);
  });
});
