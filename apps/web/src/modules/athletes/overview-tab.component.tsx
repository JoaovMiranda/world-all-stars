import type { AthleteProfile } from '@was/shared';
import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { CrossSportBandReadout } from '@/modules/rankings/cross-sport-band-readout.component';
import { LegacyLevelReadout } from '@/modules/rankings/legacy-level-readout.component';
import { useContentLang } from '@/shared-ui/content-lang.helper';
import { Section } from '@/shared-ui/section.component';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { FieldSource } from './field-source.component';
import { LegacyCard } from './legacy-card.component';
import { TierVoteCard } from './tier-vote-card.component';

/**
 * Overview: legacy ("Why…?"), cross-sport band and legacy level readouts (separately labelled, §11.1), tier vote, the
 * template's sport-specific block (panel, classes, rankings) and bio.
 */
export function OverviewTab({ profile, sportPanel }: { profile: AthleteProfile; sportPanel: ReactNode }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).bio;
  const lang = useContentLang(profile.contentLocale);
  return (
    <div className="stack">
      <LegacyCard profile={profile} />
      <CrossSportBandReadout athleteSlug={profile.slug} />
      <LegacyLevelReadout athleteSlug={profile.slug} />
      <TierVoteCard profile={profile} />
      {sportPanel}
      <Section title={T.title}>
        <p className="bio">
          {profile.shortBio ? <span lang={lang}>{profile.shortBio}</span> : <span className="muted">{T.empty}</span>}
          {profile.shortBio && <FieldSource profile={profile} field="short_bio" />}
        </p>
      </Section>
    </div>
  );
}
