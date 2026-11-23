import type { ParticipationApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { CommentsService } from './comments.service';

/** Comments tab of a profile (doc 20). */
export class CommentsController extends BaseController {
  list({ params, query }: ContractInputOf<typeof ParticipationApi.comments>) {
    return this.service(CommentsService).listComments(params.slug, query.sort, query.cursor);
  }

  post({ params, body }: ContractInputOf<typeof ParticipationApi.postComment>) {
    return this.service(CommentsService).postComment(this.user, params.slug, body.body, body.parentId);
  }

  react({ params, body }: ContractInputOf<typeof ParticipationApi.reactToComment>) {
    return this.service(CommentsService).reactToComment(this.user, params.id, body.reaction);
  }

  delete({ params }: ContractInputOf<typeof ParticipationApi.deleteComment>) {
    return this.service(CommentsService).deleteComment(this.user, params.id);
  }
}
