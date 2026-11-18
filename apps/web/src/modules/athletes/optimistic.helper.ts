import type { Comment, CommentThread, PostCommentRequest, Tier, TierVotesResponse } from '@was/shared';

/** Shares as they will be after my vote moves to `tier` (one vote per user: the old tier loses it). */
export function applyVote(votes: TierVotesResponse, tier: Tier): TierVotesResponse {
  if (votes.myVote === tier) return votes;
  const counts = { ...votes.counts };
  if (votes.myVote) counts[votes.myVote] = Math.max(0, (counts[votes.myVote] ?? 0) - 1);
  counts[tier] = (counts[tier] ?? 0) + 1;
  return { ...votes, counts, myVote: tier, total: votes.myVote ? votes.total : votes.total + 1 };
}

/** Prefix of the ids of comments that exist only on screen while their POST is in flight. */
export const PENDING_COMMENT_PREFIX = 'pending:';

/**
 * Threads with my in-flight comments already in place (top-level first, replies at the end of their thread). They
 * leave when the POST settles: on success the refetched page holds the real row, on 422 the form shows the error.
 */
export function withPendingComments(threads: readonly CommentThread[], pending: readonly PostCommentRequest[], author: string, now: string): CommentThread[] {
  if (!pending.length) return [...threads];
  const draft = (p: PostCommentRequest, i: number): Comment => ({
    id: `${PENDING_COMMENT_PREFIX}${i}`,
    parentId: p.parentId ?? null,
    body: p.body.trim(),
    author,
    isMine: true,
    at: now,
    likes: 0,
    dislikes: 0,
    myReaction: null,
  });
  const drafts = pending.map(draft);
  const tops = drafts.filter((d) => !d.parentId).map((d) => ({ ...d, replies: [] }));
  return [...tops, ...threads.map((t) => ({ ...t, replies: [...t.replies, ...drafts.filter((d) => d.parentId === t.id)] }))];
}
