import { AdminApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { EntityMergeController } from './entity-merge.controller';

/** Merge/unmerge (D14). Access `admin` comes from the contracts. */
export const entityMergeRoutes = [
  defineRoute(AdminApi.mergeCandidates, (input, ctx) => new EntityMergeController(ctx).candidates(input)),
  defineRoute(AdminApi.previewMerge, (input, ctx) => new EntityMergeController(ctx).preview(input)),
  defineRoute(AdminApi.merge, (input, ctx) => new EntityMergeController(ctx).merge(input)),
  defineRoute(AdminApi.unmerge, (input, ctx) => new EntityMergeController(ctx).unmerge(input)),
  defineRoute(AdminApi.listMerges, (_input, ctx) => new EntityMergeController(ctx).history()),
];
