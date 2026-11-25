import type { CrossSportApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { CrossSportService } from './cross-sport.service';

/** Cross-sport bands (D07) and legacy levels (D11): public readouts and the admin list of unmapped facts. */
export class CrossSportController extends BaseController {
  list({ query }: ContractInputOf<typeof CrossSportApi.list>) {
    return this.service(CrossSportService).list(query);
  }

  methodology() {
    return this.service(CrossSportService).methodology();
  }

  athleteBand({ params }: ContractInputOf<typeof CrossSportApi.athleteBand>) {
    return this.service(CrossSportService).athleteBand(params.slug);
  }

  athleteLegacy({ params }: ContractInputOf<typeof CrossSportApi.athleteLegacy>) {
    return this.service(CrossSportService).athleteLegacy(params.slug);
  }

  unmapped() {
    return this.service(CrossSportService).unmapped();
  }
}
