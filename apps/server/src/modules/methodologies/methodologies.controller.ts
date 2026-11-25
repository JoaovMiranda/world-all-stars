import type { MethodologyApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { MethodologiesService } from './methodologies.service';

/** Public methodology document of a registered ranking methodology (T4.2). */
export class MethodologiesController extends BaseController {
  doc({ params }: ContractInputOf<typeof MethodologyApi.doc>) {
    return this.service(MethodologiesService).doc(params.key);
  }
}
