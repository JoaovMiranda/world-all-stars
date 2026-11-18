import { type AthleteProfile, type Tier, TIER_ORDER, type TierVotesResponse } from '@was/shared';
import { type CSSProperties, useId, useRef, useState } from 'react';

import { castTierVote, tierVotesQuery } from '@/data/endpoints/tier-votes.query';
import { useText } from '@/i18n/use-text.hook';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { MeterList } from '@/shared-ui/meter-list.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { useSession } from '@/session/use-session.hook';

import { AdminTierForm } from './admin-tier-form.component';
import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { applyVote } from './optimistic.helper';
import { percent } from './sport-panels/sport-panel.helper';
import { celebrateVote, squash } from './vote-motion.helper';

const fillOf = (tier: Tier) => `var(--tier-${tier}-grad)`;

interface VoteOptionsProps {
  label: string;
  official: Tier;
  mine: Tier | null;
  busy?: boolean;
  /** Id of the text that explains the buttons (visitors: "sign in to vote"). */
  describedBy?: string;
  /** Gets the clicked button too, so the card can animate it once the vote is registered. */
  onVote: (tier: Tier, button: HTMLButtonElement) => void;
}

/** The 4 tier buttons (highest first), the official one marked, mine pressed. */
function VoteOptions({ label, official, mine, busy, describedBy, onVote }: VoteOptionsProps) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).vote;
  return (
    <div className="vote-options" role="group" aria-label={label} aria-describedby={describedBy} aria-busy={busy || undefined}>
      {TIER_ORDER.map((t) => (
        <button
          key={t}
          type="button"
          className="vote-opt"
          aria-pressed={mine === t}
          style={{ '--vote-tier': `var(--tier-${t}-fill)` } as CSSProperties}
          onClick={(e) => {
            squash(e.currentTarget);
            onVote(t, e.currentTarget);
          }}
        >
          <TierTag tier={t} />
          {t === official && <span className="vote-badge">{T.officialBadge}</span>}
        </button>
      ))}
    </div>
  );
}

function SignedInVote({ profile, votes }: { profile: AthleteProfile; votes: TierVotesResponse }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).vote;
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const { user, isAdmin } = useSession();
  const [error, setError] = useState(false);
  // Clicking the tier I already voted for changes nothing: say so instead of staying silent.
  const [sameVote, setSameVote] = useState(false);
  const clicked = useRef<HTMLButtonElement | null>(null);
  const cast = castTierVote.useMutation({
    onError: () => setError(true),
    onSuccess: (_data, input) => {
      setError(false);
      celebrateVote(clicked.current, input.body.tier);
    },
  });
  // Optimistic (Doherty): pressed state AND shares move at once; the refetch (this athlete only) confirms them.
  const shown = cast.isPending && cast.variables ? applyVote(votes, cast.variables.body.tier) : votes;
  const mine = shown.myVote;
  return (
    <>
      <VoteOptions
        label={T.group}
        official={votes.official}
        mine={mine}
        busy={cast.isPending}
        onVote={(tier, button) => {
          if (cast.isPending) return;
          setSameVote(tier === votes.myVote);
          if (tier === votes.myVote) return;
          clicked.current = button;
          cast.mutate({ params: { slug: profile.slug }, body: { tier } });
        }}
      />
      <p className="vote-hint" aria-live="polite">
        {sameVote && shown.myVote ? `${T.alreadyVoted(labels.tier[shown.myVote])} ` : ''}
        {shown.myVote ? T.myVote(labels.tier[shown.myVote]) : T.noVote} {user && T.votedCount(user.tierVotesCount)}
      </p>
      {error && (
        <Notice tone="danger" live="assertive">
          {T.error}
        </Notice>
      )}
      <MeterList
        label={T.sharesLabel}
        items={TIER_ORDER.map((t) => {
          const n = shown.counts[t] ?? 0;
          const pct = percent(n, shown.total);
          return { key: t, label: labels.tier[t], percent: pct, valueText: T.share(n, pct), fill: fillOf(t), emphasis: t === votes.official };
        })}
      />
      <p className="vote-foot">{T.footnote}</p>
      {isAdmin && <AdminTierForm key={votes.official} slug={profile.slug} official={votes.official} />}
    </>
  );
}

/** Tier vote (doc 17): visitors see the official tier + 4 buttons (login popup); readers vote and see the shares. */
export function TierVoteCard({ profile }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).vote;
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const { isSignedIn, requireLogin } = useSession();
  const votes = tierVotesQuery.useQuery({ params: { slug: profile.slug } }, { enabled: isSignedIn });
  const title = T.title(profile.knownAs);
  const anonHintId = useId();

  if (!isSignedIn) {
    return (
      <Section title={title} eyebrow={T.official(labels.tier[profile.tier])}>
        <VoteOptions label={T.anonGroup} official={profile.tier} mine={null} describedBy={anonHintId} onVote={() => void requireLogin('vote')} />
        <p className="vote-hint" id={anonHintId}>
          {T.anonHint}
        </p>
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
