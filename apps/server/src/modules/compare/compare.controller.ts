import type { CompareApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { CompareService } from './compare.service';

/** Compare / head-to-head (D04): two competitors side by side. */
export class CompareController extends BaseController {
  compare({ query }: ContractInputOf<typeof CompareApi.compare>) {
    return this.service(CompareService).headToHead(query.a, query.b);
  }
}
