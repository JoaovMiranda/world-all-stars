import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';

import type { AttributedSourceKey } from './attributed-source-key.type';
import { ATTRIBUTED_SOURCES } from './attributed-sources.const';
import { cx } from './class-names.helper';
import { SOURCE_ATTRIBUTION_MESSAGES } from './source-attribution.const';

interface SourceAttributionProps {
  source: AttributedSourceKey;
  className?: string;
}

/** "Data: Fjelstul World Cup Database (CC BY-SA 4.0)" with links to the source, its license and /sources (T4.6). */
export function SourceAttribution({ source, className }: SourceAttributionProps) {
  const t = useText(SOURCE_ATTRIBUTION_MESSAGES);
  const s = ATTRIBUTED_SOURCES[source];
  return (
    <p className={cx('source-attribution muted text-sm', className)}>
      {t.data}{' '}
      <a href={s.url} target="_blank" rel="noopener noreferrer">
        {s.name}
        <span className="sr-only"> {t.external}</span>
      </a>{' '}
      (
      <a href={s.licenseUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t.licenseOf(s.license)} ${t.external}`}>
        {s.license}
      </a>
      ) · <Link to="/sources">{t.allSources}</Link>
    </p>
  );
}
