import type { SourceRef } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { NewTabNote } from '@/shared-ui/new-tab-note.component';
import { Section } from '@/shared-ui/section.component';
import { SourceAttribution } from '@/shared-ui/source-attribution.component';

import { COMPETITIONS_MESSAGES } from './competitions.const';

/** Source links of a competition or edition (hidden when there are none). */
export function CompetitionSources({ sources }: { sources: readonly SourceRef[] }) {
  const t = useText(COMPETITIONS_MESSAGES);
  if (!sources.length) return null;
  return (
    <Section title={t.sources} id="sources">
      <p className="muted">{t.sourcesLead}</p>
      <ul className="stack">
        {sources.map((s) => (
          <li key={s.url}>
            <a href={s.url} target="_blank" rel="noopener noreferrer">
              {s.name}
              <NewTabNote />
            </a>
            {s.license && <span className="muted"> · {s.license}</span>}
          </li>
        ))}
      </ul>
      {sources.some((s) => s.slug === 'fjelstul') && <SourceAttribution source="fjelstul" className="mt-3" />}
    </Section>
  );
}
