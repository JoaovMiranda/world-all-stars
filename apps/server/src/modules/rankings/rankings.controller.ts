import type { RankingsApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { RankingsService } from './rankings.service';

/** Rankings (handoff v3 §8): public = published snapshots only; admin = calculate + two approvals to publish. */
export class RankingsController extends BaseController {
  list() {
    return this.service(RankingsService).listPublished();
  }

  detail({ params, query }: ContractInputOf<typeof RankingsApi.detail>) {
    return this.service(RankingsService).detail(params.id, query.page, query.pageSize);
  }

  methodologies() {
    return this.service(RankingsService).methodologies();
  }

  athlete({ params }: ContractInputOf<typeof RankingsApi.athlete>) {
    return this.service(RankingsService).athleteRankings(params.slug);
  }

  adminList() {
    return this.service(RankingsService).listAll();
  }

  async calculate({ body }: ContractInputOf<typeof RankingsApi.calculate>) {
    await this.service(RankingsService).calculate(body.methodology);
    return { ok: true as const };
  }

  async approve({ params, body }: ContractInputOf<typeof RankingsApi.approve>) {
    await this.service(RankingsService).approve(params.id, body.reason);
    return { ok: true as const };
  }
}
