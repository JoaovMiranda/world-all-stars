import type { AdminApi, ParticipationApi } from '@was/shared';

import { BaseController } from '../../core/base.controller';
import type { ContractInputOf } from '../../http/contract-input-of.interface';
import { TierVotesService } from './tier-votes.service';

/** Community tier votes (doc 17) and the admin's official tier. */
export class TierVotesController extends BaseController {
  tierVotes({ params }: ContractInputOf<typeof ParticipationApi.tierVotes>) {
    return this.service(TierVotesService).getTierVotes(this.user, params.slug);
  }

  castTierVote({ params, body }: ContractInputOf<typeof ParticipationApi.castTierVote>) {
    return this.service(TierVotesService).castTierVote(this.user, params.slug, body.tier);
  }

  setOfficialTier({ params, body }: ContractInputOf<typeof AdminApi.setOfficialTier>) {
    return this.service(TierVotesService).setOfficialTier(params.slug, body);
  }
}
