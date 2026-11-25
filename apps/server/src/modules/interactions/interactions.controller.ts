import type { InteractionsApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { InteractionsService } from './interactions.service';

/** Exclusive star + unlimited hearts (D02/D03). */
export class InteractionsController extends BaseController {
  myInteractions() {
    return this.service(InteractionsService).myInteractions(this.user);
  }

  setStar({ params }: ContractInputOf<typeof InteractionsApi.setStar>) {
    return this.service(InteractionsService).setStar(this.user, params.slug);
  }

  clearStar({ params }: ContractInputOf<typeof InteractionsApi.clearStar>) {
    return this.service(InteractionsService).clearStar(this.user, params.slug);
  }

  toggleHeart({ params, body }: ContractInputOf<typeof InteractionsApi.toggleHeart>) {
    return this.service(InteractionsService).setHeart(this.user, params.slug, body.hearted);
  }
}
