import {
  type Comment,
  type CommentReaction,
  CommentSort,
  type CommentsResponse,
  type CommentThread,
  COMMENT_MAX_LENGTH,
  type SessionUser,
} from '@was/shared';

import { demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';

type Row = Comment & { slug: string };

/** Every visible comment row (sample + demo), with the tester's reactions and authorship applied. */
export const commentRows = async (sample: typeof loadSample, user: SessionUser | null): Promise<Row[]> => {
  const all = await sample('comments.json');
  const demo = demoStore.get();
  const sampleRows = Object.entries(all).flatMap(([slug, r]) =>
    r.threads.flatMap(({ replies, ...top }) => [{ ...top, slug }, ...replies.map((x) => ({ ...x, slug }))]),
  );
  const demoRows: Row[] = demo.comments.map((c) => ({ ...c, isMine: false, likes: 0, dislikes: 0, myReaction: null }));
  return [...sampleRows, ...demoRows]
    .filter((c) => !demo.hiddenComments[c.id] && !demo.deletedComments.includes(c.id))
    .map((c) => {
      const reaction: CommentReaction | undefined = user ? demo.reactions[c.id] : undefined;
      return {
        ...c,
        isMine: !!user && c.author === user.name,
        likes: c.likes + (reaction === 'like' ? 1 : 0),
        dislikes: c.dislikes + (reaction === 'dislike' ? 1 : 0),
        myReaction: reaction ?? null,
      };
    });
};

const score = (c: Comment) => c.likes - c.dislikes;

/** Threads of one athlete, sorted like the API (top: likes − dislikes then newest; recent: newest). */
export const buildComments = (rows: readonly Row[], slug: string, sort: CommentSort): CommentsResponse => {
  const own = rows.filter((r) => r.slug === slug);
  const strip = ({ slug: _slug, ...c }: Row): Comment => c;
  const threads: CommentThread[] = own
    .filter((c) => !c.parentId)
    .map((top) => ({
      ...strip(top),
      replies: own.filter((r) => r.parentId === top.id).sort((a, b) => a.at.localeCompare(b.at)).map(strip),
    }))
    .sort((a, b) => (sort === CommentSort.Recent ? b.at.localeCompare(a.at) : score(b) - score(a) || b.at.localeCompare(a.at)));
  return { threads, total: own.length, max: COMMENT_MAX_LENGTH, nextCursor: null };
};
