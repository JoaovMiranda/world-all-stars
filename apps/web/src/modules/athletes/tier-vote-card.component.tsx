import { type AthleteProfile, type Tier, TIER_MEDAL, TIER_ORDER, type TierVotesResponse } from '@was/shared';
import { useState } from 'react';

import { castTierVote, tierVotesQuery } from '@/data/endpoints/tier-votes.query';
import { TIER_LABEL } from '@/shared-ui/domain-labels.const';
import { MeterList } from '@/shared-ui/meter-list.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { useSession } from '@/session/use-session.hook';

import { AdminTierForm } from './admin-tier-form.component';
import { ATHLETE_PROFILE_TEXT } from './athletes.const';
import { percent } from './sport-panels/sport-panel.helper';

const T = ATHLETE_PROFILE_TEXT.vote;
const fillOf = (tier: Tier) => {
  const metal = TIER_MEDAL[tier];
  return metal ? `var(--grad-${metal})` : 'var(--border-strong)';
};

interface VoteOptionsProps {
  label: string;
  official: Tier;
  mine: Tier | null;
  busy?: boolean;
  onVote: (tier: Tier) => void;
}

/** The 4 tier buttons (highest first), the official one marked, mine pressed. */
function VoteOptions({ label, official, mine, busy, onVote }: VoteOptionsProps) {
  return (
    <div className="vote-options" role="group" aria-label={label}>
      {TIER_ORDER.map((t) => (
        <button key={t} type="button" className="vote-opt" aria-pressed={mine === t} disabled={busy} onClick={() => onVote(t)}>
          <TierTag tier={t} />
          {t === official && <span className="vote-badge">{T.officialBadge}</span>}
        </button>
      ))}
    </div>
  );
}

function SignedInVote({ profile, votes }: { profile: AthleteProfile; votes: TierVotesResponse }) {
  const { user, isAdmin } = useSession();
  const [error, setError] = useState(false);
  const cast = castTierVote.useMutation({ onError: () => setError(true), onSuccess: () => setError(false) });
  return (
    <>
      <VoteOptions
        label={T.group}
        official={votes.official}
        mine={votes.myVote}
        busy={cast.isPending}
        onVote={(tier) => cast.mutate({ params: { slug: profile.slug }, body: { tier } })}
      />
      <p className="vote-hint" aria-live="polite">
        {votes.myVote ? T.myVote(TIER_LABEL[votes.myVote]) : T.noVote} {user && T.votedCount(user.tierVotesCount)}
      </p>
      {error && (
        <Notice tone="danger" live="assertive">
          {T.error}
        </Notice>
      )}
      <MeterList
        label={T.sharesLabel}
        items={TIER_ORDER.map((t) => {
          const n = votes.counts[t] ?? 0;
          const pct = percent(n, votes.total);
          return { key: t, label: TIER_LABEL[t], percent: pct, valueText: T.share(n, pct), fill: fillOf(t), emphasis: t === votes.official };
        })}
      />
      <p className="vote-foot">{T.footnote}</p>
      {isAdmin && <AdminTierForm key={votes.official} slug={profile.slug} official={votes.official} />}
    </>
  );
}

/** Tier vote (doc 17): visitors see the official tier + 4 buttons (login popup); readers vote and see the shares. */
export function TierVoteCard({ profile }: { profile: AthleteProfile }) {
  const { isSignedIn, requireLogin } = useSession();
  const votes = tierVotesQuery.useQuery({ params: { slug: profile.slug } }, { enabled: isSignedIn });
  const title = T.title(profile.knownAs);

  if (!isSignedIn) {
    return (
      <Section title={title} eyebrow={T.official(TIER_LABEL[profile.tier])}>
        <VoteOptions label={T.anonGroup} official={profile.tier} mine={null} onVote={() => requireLogin('vote')} />
        <p className="vote-hint">{T.anonHint}</p>
      </Section>
    );
  }
  return (
    <Section title={title} eyebrow={votes.data ? T.total(votes.data.total) : undefined} busy={votes.isFetching}>
      <QueryBoundary query={votes} loading={<SkeletonList rows={3} className="h-8 w-full" />}>
        {(v) => <SignedInVote profile={profile} votes={v} />}
      </QueryBoundary>
    </Section>
  );
}
