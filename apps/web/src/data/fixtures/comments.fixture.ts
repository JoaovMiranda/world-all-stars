import {
  buildCommentThreads,
  COMMENT_EDIT_WINDOW_MS,
  type Comment,
  type CommentReaction,
  type CommentSort,
  type CommentsResponse,
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
  // The tester's own demo comments stay editable for 10 minutes after posting (T3.3).
  const editable = (at: string) => Date.parse(at) + COMMENT_EDIT_WINDOW_MS;
  const demoRows: Row[] = demo.comments.map((c) => ({
    ...c,
    isMine: false,
    likes: 0,
    dislikes: 0,
    myReaction: null,
    ...(editable(c.at) > Date.now() ? { editableUntil: new Date(editable(c.at)).toISOString() } : {}),
  }));
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

/** Threads of one athlete: same shared builder (order, 1-level replies) as the server. */
export const buildComments = (rows: readonly Row[], slug: string, sort: CommentSort, cursor?: string): CommentsResponse =>
  buildCommentThreads(
    rows.filter((r) => r.slug === slug).map(({ slug: _slug, ...c }): Comment => c),
    sort,
    { cursor },
  );
