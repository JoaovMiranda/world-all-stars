import { CommentReaction } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { applyReaction } from './comment-reaction.helper';

const base = { likes: 3, dislikes: 1, myReaction: null };

describe('applyReaction', () => {
  it('adds a new reaction', () => {
    expect(applyReaction(base, CommentReaction.Like)).toEqual({ likes: 4, dislikes: 1, myReaction: CommentReaction.Like });
  });

  it('switches like to dislike', () => {
    const liked = { likes: 4, dislikes: 1, myReaction: CommentReaction.Like };
    expect(applyReaction(liked, CommentReaction.Dislike)).toEqual({ likes: 3, dislikes: 2, myReaction: CommentReaction.Dislike });
  });

  it('removes my reaction', () => {
    const disliked = { likes: 3, dislikes: 2, myReaction: CommentReaction.Dislike };
    expect(applyReaction(disliked, null)).toEqual({ likes: 3, dislikes: 1, myReaction: null });
  });

  it('never goes below zero and is a no-op for the same reaction', () => {
    expect(applyReaction({ likes: 0, dislikes: 0, myReaction: CommentReaction.Like }, null).likes).toBe(0);
    expect(applyReaction(base, null)).toBe(base);
  });
});
