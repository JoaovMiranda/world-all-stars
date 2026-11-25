import type { AthleteProfile } from '@was/shared';
import { useMemo } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { Medal } from '@/shared-ui/medal.component';
import { Section } from '@/shared-ui/section.component';

import { ATHLETE_PROFILE_MESSAGES } from '../athletes.const';
import { olympicTally } from './olympic-medals.helper';

const METALS = ['gold', 'silver', 'bronze'] as const;

/** Olympic medal tally of the athlete (gold · silver · bronze with accessible labels) and the editions with a medal. */
export function OlympicMedals({ profile }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).olympic;
  const tally = useMemo(() => olympicTally(profile), [profile]);
  const total = tally.gold + tally.silver + tally.bronze;
  return (
    <Section title={T.title} eyebrow={T.eyebrow}>
      {total === 0 ? (
        <EmptyState compact title={T.empty} />
      ) : (
        <>
          <p className="medal-row">
            {METALS.map((m) => (
              <Medal key={m} metal={m}>
                {tally[m]}
              </Medal>
            ))}
            <span>{T.total(total)}</span>
          </p>
          <p className="vote-foot">
            {T.editions}: {tally.years.join(' · ')}
          </p>
        </>
      )}
    </Section>
  );
}
