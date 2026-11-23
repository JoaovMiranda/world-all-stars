import type { ParticipationApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { SessionService } from './session.service';

/** Session, "me" page (E2) and notifications (E4). */
export class SessionController extends BaseController {
  session() {
    return this.service(SessionService).getSession();
  }

  me() {
    return this.service(SessionService).getMe(this.user);
  }

  notifications() {
    return this.service(SessionService).getNotifications(this.user);
  }

  markNotificationRead({ params }: ContractInputOf<typeof ParticipationApi.markNotificationRead>) {
    return this.service(SessionService).markNotificationRead(this.user, params.id);
  }
}
