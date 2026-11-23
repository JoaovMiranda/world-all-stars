import type { AdminApi, MergeCandidatesResponse, MergeHistoryResponse, MergePreviewResponse } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { EntityMergeService } from './entity-merge.service';

/** Merge/unmerge of competitors (D14): validated contract input → EntityMergeService. */
export class EntityMergeController extends BaseController {
  candidates({ query }: ContractInputOf<typeof AdminApi.mergeCandidates>): Promise<MergeCandidatesResponse> {
    return this.service(EntityMergeService).candidates(query.q);
  }

  preview({ body }: ContractInputOf<typeof AdminApi.previewMerge>): Promise<MergePreviewResponse> {
    return this.service(EntityMergeService).preview(body.survivorId, body.mergedId);
  }

  merge({ body }: ContractInputOf<typeof AdminApi.merge>): Promise<{ id: string }> {
    return this.service(EntityMergeService).merge(body);
  }

  unmerge({ params, body }: ContractInputOf<typeof AdminApi.unmerge>): Promise<{ ok: true }> {
    return this.service(EntityMergeService).unmerge(params.id, body.reason);
  }

  history(): Promise<MergeHistoryResponse> {
    return this.service(EntityMergeService).history();
  }
}
