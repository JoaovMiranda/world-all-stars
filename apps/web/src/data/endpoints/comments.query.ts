import { CommentSort, CommentsQuerySchema, ParticipationApi } from '@was/shared';

import { demoStore } from '../demo.store';
import { bySlug, defineMutation, defineQuery } from '../define-endpoint.helper';
import { editDemoComment, postDemoComment, reactDemoComment, reportDemoComment } from '../fixtures/comment-mutations.fixture';
import { buildComments, commentRows } from '../fixtures/comments.fixture';
import { requireUser } from '../fixtures/require-user.fixture';
import { meQuery, notificationsQuery, sessionQuery } from './session.query';

/** GET /api/athletes/:slug/comments?sort=top|recent (doc 20). Public read. */
export const commentsQuery = defineQuery(ParticipationApi.comments, {
  sample: async ({ input, sample, session }) => {
    const query = CommentsQuerySchema.parse(input.query ?? {});
    return buildComments(await commentRows(sample, session.user), input.params.slug, query.sort ?? CommentSort.Top, query.cursor);
  },
  empty: () => ({ threads: [], total: 0, max: 500, nextCursor: null }),
});

const afterComment = [commentsQuery, sessionQuery, meQuery, notificationsQuery] as const;
/** A new comment only changes the threads of its athlete. */
const afterPost = [bySlug(commentsQuery), sessionQuery, meQuery, notificationsQuery] as const;

/** POST /api/athletes/:slug/comments: comment or reply (shared validation, 422 on failure). */
export const postComment = defineMutation(
  ParticipationApi.postComment,
  ({ input, sample, session }) => postDemoComment(sample, requireUser(session), input.params.slug, input.body.body, input.body.parentId),
  { invalidates: afterPost },
);

/** PUT /api/comments/:id/reaction: like/dislike, null undoes. 403 on your own comment. */
export const reactToComment = defineMutation(
  ParticipationApi.reactToComment,
  ({ input, sample, session }) => reactDemoComment(sample, requireUser(session), input.params.id, input.body.reaction),
  { invalidates: [commentsQuery] },
);

/** DELETE /api/comments/:id (soft delete by the author). */
export const deleteComment = defineMutation(
  ParticipationApi.deleteComment,
  ({ input }) => {
    demoStore.update((d) => {
      d.deletedComments.push(input.params.id);
    });
    return { ok: true };
  },
  { invalidates: afterComment },
);

/** PATCH /api/comments/:id: the author edits within 10 minutes of posting (T3.3). */
export const editComment = defineMutation(
  ParticipationApi.editComment,
  ({ input, sample, session }) => editDemoComment(sample, requireUser(session), input.params.id, input.body.body),
  { invalidates: afterComment },
);

/** POST /api/comments/:id/report: report to the moderators (once per reader; idempotent). */
export const reportComment = defineMutation(ParticipationApi.reportComment, ({ input, sample, session }) =>
  reportDemoComment(sample, requireUser(session), input.params.id),
);
