import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { CommentsController } from './comments.controller';

export const commentsRoutes = [
  defineRoute(ParticipationApi.comments, (input, ctx) => new CommentsController(ctx).list(input)),
  defineRoute(ParticipationApi.postComment, (input, ctx) => new CommentsController(ctx).post(input), { rateLimit: 'comment' }),
  defineRoute(ParticipationApi.reactToComment, (input, ctx) => new CommentsController(ctx).react(input), { rateLimit: 'reaction' }),
  defineRoute(ParticipationApi.editComment, (input, ctx) => new CommentsController(ctx).edit(input), { rateLimit: 'comment' }),
  defineRoute(ParticipationApi.reportComment, (input, ctx) => new CommentsController(ctx).report(input), { rateLimit: 'report' }),
  defineRoute(ParticipationApi.deleteComment, (input, ctx) => new CommentsController(ctx).delete(input)),
];
