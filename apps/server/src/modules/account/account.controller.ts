import type { ParticipationApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { AccountService } from './account.service';

/** E6 (my data, consents, export) + consent acceptance and account deletion (doc 13). */
export class AccountController extends BaseController {
  acceptConsent({ body }: ContractInputOf<typeof ParticipationApi.acceptConsent>) {
    return this.service(AccountService).acceptConsent(body);
  }

  myData() {
    return this.service(AccountService).getMyData(this.user);
  }

  updateConsent({ params, body }: ContractInputOf<typeof ParticipationApi.updateConsent>) {
    return this.service(AccountService).updateConsent(this.user, params.purpose, body.granted);
  }

  exportMyData() {
    return this.service(AccountService).exportMyData(this.user);
  }

  deleteAccount({ body }: ContractInputOf<typeof ParticipationApi.deleteAccount>) {
    return this.service(AccountService).deleteAccount(this.user, body.confirmation);
  }
}
