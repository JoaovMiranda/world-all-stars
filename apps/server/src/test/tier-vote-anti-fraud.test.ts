// Tier-vote anti-fraud (T3.2): one vote per account, account age ≥ 24 h, per-IP-hash daily limit, anomaly flag
// (≥ 30 votes in 1 h from accounts < 7 days) excluded from the admin signal until an admin reviews it.
import { tierVoteFlags, tierVotes } from '@was/db';
import { AdminApi, AdminDecision, RATE_LIMITS, TIER_VOTE_ANOMALY_MIN_VOTES, Tier, TierVoteFlagStatus } from '@was/shared';
import { and, eq, isNull } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { HttpError } from '../http/http-error.error';
import { AdminReviewService } from '../modules/admin/admin-review.service';
import { TierVotesService } from '../modules/tier-votes/tier-votes.service';
import { HAS_PROTOTYPE } from './test-app.const';
import { createTestApp } from './test-app.helper';
import type { TestApp } from './test-app.interface';
import { createTestUser, readerContext } from './test-user.helper';

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY);
const statusOf = async (p: Promise<unknown>) => {
  try {
    await p;
    return 200;
  } catch (error) {
    return error instanceof HttpError ? error.status : 500;
  }
};

describe.skipIf(!HAS_PROTOTYPE)('tier vote anti-fraud (T3.2)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(() => t.close());

  const voter = async (label: string, ageDays: number, ipHash = `ip-${label}`) => {
    const user = await createTestUser(t, label, daysAgo(ageDays));
    return { user, svc: new TierVotesService(readerContext(t, user, { ipHash })) };
  };

  it('one vote per account per athlete: voting again changes the same row, the counter stays at 1', async () => {
    const { user, svc } = await voter('once', 30);
    await svc.castTierVote(user, 'pele', Tier.Elite);
    const second = await svc.castTierVote({ ...user, tierVotesCount: 1 }, 'pele', Tier.Legendary);
    expect(second.userVotesCount).toBe(1);
    const rows = await t.deps.db
      .select()
      .from(tierVotes)
      .where(and(eq(tierVotes.userId, user.id), isNull(tierVotes.deletedAt)));
    expect(rows).toHaveLength(1);
  });

  it('accounts younger than 24 h cannot vote (403 account_too_new); older ones can', async () => {
    const young = await voter('young', 0.5);
    const err = await young.svc.castTierVote(young.user, 'pele', Tier.Elite).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect((err as HttpError).status).toBe(403);
    expect((err as HttpError).body.error).toBe('account_too_new');
    const grown = await voter('grown', 1.5);
    expect(await statusOf(grown.svc.castTierVote(grown.user, 'pele', Tier.Elite))).toBe(200);
  });

  it('accounts younger than 7 days voting in a burst on one athlete are flagged; old accounts are not', async () => {
    const admin = await createTestUser(t, 'admin-reviewer', daysAgo(90));
    const review = new AdminReviewService(readerContext(t, admin));
    const phelps = async () => (await review.listTierSignals()).items.find((i) => i.athlete.slug === 'michael-phelps')!;
    const baseMythic = (await phelps()).counts[Tier.Mythic] ?? 0;
    const veteran = await voter('veteran', 60);
    await veteran.svc.castTierVote(veteran.user, 'michael-phelps', Tier.Champion);
    const burst = [];
    for (let i = 0; i < TIER_VOTE_ANOMALY_MIN_VOTES; i++) burst.push(await voter(`burst-${i}`, 2));
    for (const [i, v] of burst.entries()) {
      await v.svc.castTierVote(v.user, 'michael-phelps', Tier.Mythic);
      const flags = await t.deps.db.select().from(tierVoteFlags).where(isNull(tierVoteFlags.deletedAt));
      // Below the threshold nobody is flagged; at the threshold every young voter of the burst is.
      expect(flags.length).toBe(i + 1 < TIER_VOTE_ANOMALY_MIN_VOTES ? 0 : TIER_VOTE_ANOMALY_MIN_VOTES);
    }
    const flagged = await t.deps.db.select().from(tierVoteFlags).where(isNull(tierVoteFlags.deletedAt));
    expect(flagged.every((f) => f.status === TierVoteFlagStatus.Pending)).toBe(true);
    expect(flagged.some((f) => f.userId === veteran.user.id)).toBe(false);

    // Signal: the flagged votes are left out of the counts until reviewed.
    const before = await phelps();
    expect(before.excludedVotes).toBe(TIER_VOTE_ANOMALY_MIN_VOTES);
    expect(before.counts[Tier.Mythic] ?? 0).toBe(baseMythic);
    const listed = (await review.listTierSignals()).flags;
    expect(listed.filter((f) => f.status === TierVoteFlagStatus.Pending)).toHaveLength(TIER_VOTE_ANOMALY_MIN_VOTES);

    // Approve (cleared) → that account counts again; reject → stays out; a second decision is refused.
    const [first, second] = flagged;
    await review.reviewTierVoteFlag(first!.id, AdminDecision.Approve, 'Checked: a real fan club');
    await review.reviewTierVoteFlag(second!.id, AdminDecision.Reject, 'Same device fingerprint as the others');
    const after = await phelps();
    expect(after.excludedVotes).toBe(TIER_VOTE_ANOMALY_MIN_VOTES - 1);
    expect(after.counts[Tier.Mythic]).toBe(baseMythic + 1);
    expect(await statusOf(review.reviewTierVoteFlag(first!.id, AdminDecision.Reject, 'Changed my mind'))).toBe(422);
  });

  it('the review action is admin-only', async () => {
    expect((await t.call(AdminApi.reviewTierVoteFlag, { params: { id: 'x' }, body: { decision: 'approve', reason: 'checked it' } })).status).toBe(401);
    expect((await t.call(AdminApi.reviewTierVoteFlag, { params: { id: 'x' }, body: { decision: 'approve', reason: 'checked it' } }, 'reader')).status).toBe(
      403,
    );
  });
});

describe.skipIf(!HAS_PROTOTYPE)('tier vote anti-fraud: per-IP-hash daily limit (T3.2)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp({ rateLimit: true });
  });
  afterAll(() => t.close());

  it(`allows ${RATE_LIMITS.voteIpDaily.max} votes a day per IP hash, then 429; another IP is unaffected`, async () => {
    const shared = 'ip-shared-nat';
    const accounts = await Promise.all([0, 1, 2].map((i) => createTestUser(t, `nat-${i}`, daysAgo(30))));
    const tiers = [Tier.Elite, Tier.Legendary];
    for (let i = 0; i < RATE_LIMITS.voteIpDaily.max; i++) {
      const user = accounts[i % accounts.length]!;
      await new TierVotesService(readerContext(t, user, { ipHash: shared })).castTierVote(user, 'pele', tiers[i % 2]!);
    }
    const blocked = new TierVotesService(readerContext(t, accounts[0]!, { ipHash: shared })).castTierVote(accounts[0]!, 'pele', Tier.Elite);
    expect(await statusOf(blocked)).toBe(429);
    const elsewhere = new TierVotesService(readerContext(t, accounts[0]!, { ipHash: 'ip-other' })).castTierVote(accounts[0]!, 'pele', Tier.Elite);
    expect(await statusOf(elsewhere)).toBe(200);
  });
});
