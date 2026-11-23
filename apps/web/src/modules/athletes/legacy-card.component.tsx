import { type AthleteProfile, DossierStatus } from '@was/shared';
import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { formatDate } from '@/shared-ui/format.helper';
import { Reveal } from '@/shared-ui/reveal.component';
import { Section } from '@/shared-ui/section.component';
import { SourceInfo } from '@/shared-ui/source-info.component';
import { TierTag } from '@/shared-ui/tier-tag.component';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';

function Evidence({ type, children }: { type: string; children: ReactNode }) {
  return (
    <div className="evidence">
      <span className="evidence-type">{type}</span>
      <span>{children}</span>
    </div>
  );
}

/** "Why Mythic?" (approved "Game changer" dossier) or, for other tiers, the inclusion reason + tier history. */
export function LegacyCard({ profile }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).legacy;
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const d = profile.dossier;
  if (d && d.status === DossierStatus.Approved) {
    return (
      <Section variant="mythic" title={T.mythicTitle} eyebrow={T.approved(d.approvals)}>
        {d.headline && <p className="legacy-headline">{d.headline}</p>}
        <Reveal className="legacy-evidences" stagger name="legacy-evidences">
          {d.evidences.map((e, i) => (
            <Evidence key={i} type={T.evidence[e.type] ?? e.type}>
              {e.text}
              <SourceInfo source={e.source} field={T.evidence[e.type] ?? e.type} />
            </Evidence>
          ))}
        </Reveal>
      </Section>
    );
  }
  return (
    <Section title={T.tierTitle(labels.tier[profile.tier])} actions={<TierTag tier={profile.tier} />}>
      {profile.inclusionReason && <p className="legacy-headline legacy-headline-sm">{profile.inclusionReason}</p>}
      <Evidence type={T.percentile}>{T.percentileText(profile.percentile)}</Evidence>
      {profile.tierHistory.map((h) => (
        <Evidence key={`${h.at}-${h.to}`} type={T.tierChange}>
          {T.tierChangeText(labels.tier[h.from], labels.tier[h.to], formatDate(h.at), h.reason)}
        </Evidence>
      ))}
      <Evidence type={T.hallOfGreats}>
        <span className="muted">{T.noDossier}</span>
      </Evidence>
    </Section>
  );
}
