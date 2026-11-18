import type { AthleteProfile } from '@was/shared';
import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { Section } from '@/shared-ui/section.component';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { FieldSource } from './field-source.component';
import { LegacyCard } from './legacy-card.component';
import { TierVoteCard } from './tier-vote-card.component';

/** Visão geral: legacy ("Por que é…?"), tier vote, sport-specific panel and bio. */
export function OverviewTab({ profile, sportPanel }: { profile: AthleteProfile; sportPanel: ReactNode }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).bio;
  return (
    <div className="stack">
      <LegacyCard profile={profile} />
      <TierVoteCard profile={profile} />
      {sportPanel}
      <Section title={T.title}>
        <p className="bio">
          {profile.shortBio ?? <span className="muted">{T.empty}</span>}
          {profile.shortBio && <FieldSource profile={profile} field="short_bio" />}
        </p>
      </Section>
    </div>
  );
}
