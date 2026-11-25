import type { CompetitionsApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { CompetitionsService } from './competitions.service';

/** Public competition and edition pages (T4.1). */
export class CompetitionsController extends BaseController {
  competition({ params }: ContractInputOf<typeof CompetitionsApi.competition>) {
    return this.service(CompetitionsService).competition(params.competition);
  }

  edition({ params }: ContractInputOf<typeof CompetitionsApi.edition>) {
    return this.service(CompetitionsService).edition(params.competition, params.edition);
  }
}
