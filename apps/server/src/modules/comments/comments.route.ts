import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { deleteComment, listComments, postComment, reactToComment } from './comments.service';

export const commentsRoutes = [
  defineRoute(ParticipationApi.comments, ({ params, query }, ctx) => listComments(ctx, params.slug, query.sort, query.cursor)),
  defineRoute(ParticipationApi.postComment, ({ params, body }, ctx) => postComment(ctx, ctx.user, params.slug, body.body, body.parentId), { rateLimit: 'comment' }),
  defineRoute(ParticipationApi.reactToComment, ({ params, body }, ctx) => reactToComment(ctx, ctx.user, params.id, body.reaction), { rateLimit: 'reaction' }),
  defineRoute(ParticipationApi.deleteComment, ({ params }, ctx) => deleteComment(ctx, ctx.user, params.id)),
];
