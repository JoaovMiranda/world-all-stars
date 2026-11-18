import { type SessionUser, type Tier, type TierVotesResponse, officialTierChangeError } from '@was/shared';

import { localeStore } from '@/i18n/locale.store';

import { ApiError } from '../api-error.error';
import { demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';

/** GET tier votes: sample counts + the tester's vote; official tier with admin demo changes (doc 17). */
export const buildTierVotes = async (sample: typeof loadSample, slug: string): Promise<TierVotesResponse> => {
  const all = await sample('tier-votes.json');
  const base = all[slug];
  if (!base) throw new ApiError(404, { error: 'not_found' });
  const demo = demoStore.get();
  const mine = demo.votes[slug]?.tier ?? null;
  const counts = { ...base.counts };
  if (mine) counts[mine] = (counts[mine] ?? 0) + 1;
  return { counts, total: base.total + (mine ? 1 : 0), official: demo.officialTiers[slug]?.tier ?? base.official, myVote: mine };
};

/** PUT vote: create or change (changing does not change the user's counter). */
export const castDemoVote = (user: SessionUser, slug: string, tier: Tier) => {
  const isNew = !demoStore.get().votes[slug];
  demoStore.update((d) => {
    d.votes[slug] = { tier, at: new Date().toISOString() };
  });
  return { myVote: tier, userVotesCount: user.tierVotesCount + (isNew ? 1 : 0) };
};

/** PATCH official tier (admin): Mythic requires an approved dossier; same tier refused. */
export const setDemoOfficialTier = async (sample: typeof loadSample, slug: string, tier: Tier, reason: string) => {
  const profile = (await sample('athlete-profiles.json'))[slug];
  if (!profile) throw new ApiError(404, { error: 'not_found' });
  const current = demoStore.get().officialTiers[slug]?.tier ?? profile.tier;
  const refusal = officialTierChangeError({ current, target: tier, dossierStatus: profile.dossier?.status ?? null }, localeStore.get());
  if (refusal) throw new ApiError(422, refusal);
  demoStore.update((d) => {
    d.officialTiers[slug] = { tier, reason, at: new Date().toISOString() };
  });
  return { official: tier };
};
