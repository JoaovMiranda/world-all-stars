import type { SourceRef } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';

import { UI_MESSAGES } from './ui-text.const';

interface SourceInfoProps {
  source: SourceRef | null;
  /** Field the source backs (accessible label). */
  field: string;
}

/** The ⓘ next to a value: opens the exact source link in a new tab ("the source is always one click away"). */
export function SourceInfo({ source, field }: SourceInfoProps) {
  const ui = useText(UI_MESSAGES);
  if (!source) return null;
  const label = `${ui.sourceOf(field, source.name)} (${source.license}) ${ui.external}`;
  return (
    <a className="src" href={source.url} target="_blank" rel="noopener noreferrer" aria-label={label} title={`${source.name} · ${source.license}`}>
      i
    </a>
  );
}
