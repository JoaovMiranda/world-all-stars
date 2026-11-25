import { athletes, athleteTierHistory, type BaseRepository, tierVoteFlags, tierVotes, users } from '@was/db';
import {
  AdminAuditAction,
  ApiErrorCode,
  type CastTierVoteResponse,
  officialTierChangeError,
  type SetOfficialTierRequest,
  TIER_VOTE_ANOMALY_ACCOUNT_AGE_MS,
  TIER_VOTE_ANOMALY_MIN_VOTES,
  TIER_VOTE_ANOMALY_WINDOW_MS,
  TIER_VOTE_MIN_ACCOUNT_AGE_MS,
  type Tier,
  TierVoteFlagStatus,
  type TierVotesResponse,
  tierVoteCounts,
  toIsoDate,
} from '@was/shared';

import type { AuthUser } from '../../auth/auth-provider.type';
import { BaseService } from '../../core/base.service';
import { forbidden, notFound, unprocessable } from '../../http/http-error.helper';
import type { CatalogView } from '../catalog/catalog.view';
import { TierVotesRepository } from './tier-votes.repository';

const athleteOrThrow = (view: CatalogView, slug: string) => {
  const a = view.athleteBySlug(slug);
  if (!a) throw notFound();
  return a;
};
const tierId = (view: CatalogView, tier: Tier) => view.rows.tiers.find((t) => t.slug === tier)!.id;

/** Community tier votes (doc 17) and the admin's official tier. */
export class TierVotesService extends BaseService {
  /** GET tier votes (doc 17): counts per tier, total, official tier and my vote. */
  async getTierVotes(user: AuthUser, slug: string): Promise<TierVotesResponse> {
    const view = await this.ctx.deps.catalog.get(this.ctx.locale);
    const a = athleteOrThrow(view, slug);
    const votes = await new TierVotesRepository(this.db).votesOfAthlete(a.id);
    return {
      counts: tierVoteCounts(votes.map((v) => v.tier)),
      total: votes.length,
      official: view.tierOf(a.championTierId),
      myVote: votes.find((v) => v.userId === user.id)?.tier ?? null,
    };
  }

  /**
   * PUT my vote: one per account per athlete (unique index + update of the existing row); changing it does NOT change
   * the user's counter (doc 17). Anti-fraud (T3.2): the account must be ≥ 24 h old (403 account_too_new), each IP hash
   * casts at most RATE_LIMITS.voteIpDaily votes a day (429), and a burst of votes from young accounts flags them.
   */
  async castTierVote(user: AuthUser, slug: string, tier: Tier): Promise<CastTierVoteResponse> {
    const actor = this.actor;
    const view = await this.ctx.deps.catalog.get(this.ctx.locale);
    const a = athleteOrThrow(view, slug);
    const target = tierId(view, tier);
    const createdAt = await new TierVotesRepository(this.db).accountCreatedAt(user.id);
    if (!createdAt || Date.now() - createdAt.getTime() < TIER_VOTE_MIN_ACCOUNT_AGE_MS) throw forbidden(ApiErrorCode.AccountTooNew, 'accountTooNew');
    await this.ctx.deps.rateLimiter.hit('voteIpDaily', this.ctx.ipHash);
    return this.transaction(async (repo) => {
      const existing = await new TierVotesRepository(repo.db).findVote(user.id, a.id);
      let count = user.tierVotesCount;
      if (existing) {
        if (existing.championTierId !== target) await repo.update(tierVotes, existing.id, { championTierId: target }, actor, { summary: `vote → ${tier}` });
      } else {
        await repo.insert(tierVotes, { userId: user.id, athleteId: a.id, championTierId: target }, actor);
        count = (await repo.increment(users, user.id, { tierVotesCount: 1 })).tierVotesCount;
      }
      await this.flagBurst(repo, a.id);
      return { myVote: tier, userVotesCount: count };
    });
  }

  /**
   * Anomaly rule (T3.2): when at least TIER_VOTE_ANOMALY_MIN_VOTES votes on one athlete were cast or changed within the
   * last hour by accounts younger than 7 days, every one of those accounts not flagged yet gets a pending flag (their
   * votes leave the admin signal until an admin reviews them).
   */
  private async flagBurst(repo: BaseRepository, athleteId: string): Promise<void> {
    const now = Date.now();
    const read = new TierVotesRepository(repo.db);
    const voters = await read.youngVotersSince(athleteId, new Date(now - TIER_VOTE_ANOMALY_WINDOW_MS), new Date(now - TIER_VOTE_ANOMALY_ACCOUNT_AGE_MS));
    if (voters.length < TIER_VOTE_ANOMALY_MIN_VOTES) return;
    const already = await read.flaggedAccounts(voters);
    const fresh = voters.filter((id) => !already.has(id));
    if (!fresh.length) return;
    // `ensure` (INSERT … ON CONFLICT DO NOTHING on the per-account unique index): two votes of the same burst committing
    // at the same time cannot raise the same flag twice.
    for (const userId of fresh)
      await repo.ensure(tierVoteFlags, { userId }, { userId, athleteId, burstVotes: voters.length, status: TierVoteFlagStatus.Pending }, this.actor);
  }

  /** PATCH official tier (admin): shared rule (Mythic needs an approved dossier, same tier refused) + history + audit. */
  async setOfficialTier(slug: string, body: SetOfficialTierRequest): Promise<{ official: Tier }> {
    const { actor, locale } = this.ctx;
    const view = await this.ctx.deps.catalog.get(locale);
    const a = athleteOrThrow(view, slug);
    const current = view.tierOf(a.championTierId);
    const refusal = officialTierChangeError({ current, target: body.tier, dossierStatus: view.dossierOf(a.id)?.status ?? null }, locale);
    if (refusal) throw unprocessable(refusal.error, refusal.message);
    await this.transaction(async (repo) => {
      await repo.update(athletes, a.id, { championTierId: tierId(view, body.tier) }, actor, {
        summary: `Tier: ${current} → ${body.tier} (${body.reason})`,
        reason: body.reason,
      });
      await repo.insert(
        athleteTierHistory,
        { athleteId: a.id, fromTierId: a.championTierId, toTierId: tierId(view, body.tier), reason: body.reason, decidedAt: toIsoDate(new Date()) },
        actor,
      );
      await repo.audit(actor, AdminAuditAction.TierChanged, { type: 'athletes', id: a.id }, { target: a.knownAs, reason: body.reason });
    });
    return { official: body.tier };
  }
}
