import type { ParticipationApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { ContactService } from './contact.service';

/** Public submissions (doc 21): athlete suggestions and contact messages. */
export class ContactController extends BaseController {
  submitSuggestion({ body }: ContractInputOf<typeof ParticipationApi.submitSuggestion>) {
    return this.service(ContactService).submitSuggestion(body);
  }

  submitContact({ body }: ContractInputOf<typeof ParticipationApi.submitContact>) {
    return this.service(ContactService).submitContact(body);
  }
}
