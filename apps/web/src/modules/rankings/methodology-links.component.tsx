import { Link } from '@tanstack/react-router';

import { rankingMethodologiesQuery } from '@/data/endpoints/rankings.query';
import { useText } from '@/i18n/use-text.hook';
import { Section } from '@/shared-ui/section.component';

import { METHODOLOGY_MESSAGES } from './methodology.const';
import { RANKINGS_MESSAGES } from './rankings.const';

/** T4.2: every registered methodology with a link to its public methodology page (rankings list). */
export function MethodologyLinks() {
  const t = useText(METHODOLOGY_MESSAGES);
  const names = useText(RANKINGS_MESSAGES).list.methodologies;
  const methodologies = rankingMethodologiesQuery.useQuery();
  const items = methodologies.data?.items ?? [];
  if (!items.length) return null;
  return (
    <Section title={t.listTitle}>
      <p className="muted">{t.listLead}</p>
      <ul className="stack gap-2 mt-2">
        {items.map((m) => (
          <li key={m.key}>
            <Link to="/rankings/$key/methodology" params={{ key: m.key }}>
              {names[m.key] ?? m.key}
            </Link>{' '}
            <span className="muted">· v{m.version}</span>
          </li>
        ))}
      </ul>
    </Section>
  );
}
