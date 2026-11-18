import type { CommentThread, TierVotesResponse } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { PENDING_COMMENT_PREFIX, applyVote, withPendingComments } from './optimistic.helper';

const votes: TierVotesResponse = { counts: { champion: 1, elite: 2, legendary: 0, mythic: 0 }, total: 3, official: 'elite', myVote: 'elite' };

describe('optimistic views', () => {
  it('moves my vote between tiers without changing the total; a first vote adds one', () => {
    expect(applyVote(votes, 'mythic')).toMatchObject({ counts: { elite: 1, mythic: 1 }, total: 3, myVote: 'mythic' });
    expect(applyVote({ ...votes, myVote: null }, 'champion')).toMatchObject({ counts: { champion: 2 }, total: 4, myVote: 'champion' });
    expect(applyVote(votes, 'elite')).toBe(votes);
  });

  it('shows pending comments first and pending replies at the end of their thread', () => {
    const thread: CommentThread = { id: 't1', parentId: null, body: 'a', author: 'Ana', isMine: false, at: '2026-01-01T00:00:00.000Z', likes: 0, dislikes: 0, myReaction: null, replies: [] };
    const out = withPendingComments([thread], [{ body: ' novo ' }, { body: 'resposta', parentId: 't1' }], 'Eu', '2026-02-01T00:00:00.000Z');
    expect(out[0]).toMatchObject({ body: 'novo', author: 'Eu', isMine: true, replies: [] });
    expect(out[0]?.id.startsWith(PENDING_COMMENT_PREFIX)).toBe(true);
    expect(out[1]?.replies.map((r) => r.body)).toEqual(['resposta']);
  });
});
