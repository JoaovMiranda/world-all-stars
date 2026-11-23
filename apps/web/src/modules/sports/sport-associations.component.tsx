import { Link } from '@tanstack/react-router';
import type { SportPage } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { OrgRow } from '@/shared-ui/org-row.component';
import { Section } from '@/shared-ui/section.component';

import { SPORTS_HASH, SPORTS_MESSAGES } from './sports.const';

/** "X associations" (#associacoes): every association as OrgRow (logo, Wikipedia, roles, nature, ⓘ). */
export function SportAssociations({ sport }: { sport: SportPage }) {
  const t = useText(SPORTS_MESSAGES).page;
  return (
    <Section id={SPORTS_HASH.associations} title={t.associationsOf(sport.name)} eyebrow={t.associationsEyebrow(sport.associations.length)}>
      {sport.associations.length > 0 ? (
        <ul className="org-list">
          {sport.associations.map((o) => (
            <OrgRow key={o.id} org={o} />
          ))}
        </ul>
      ) : (
        <p className="empty">{t.noAssociations}</p>
      )}
      <p className="muted mt-2.5 text-xs">
        {t.associationsHint}{' '}
        <Link to="/sports" hash={SPORTS_HASH.hierarchy}>
          {t.fullHierarchy}
        </Link>
      </p>
    </Section>
  );
}
