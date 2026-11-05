import type { SourceRef } from '@was/shared';

import { UI_TEXT } from './ui-text.const';

interface SourceInfoProps {
  source: SourceRef | null;
  /** Field the source backs (accessible label). */
  field: string;
}

/** The ⓘ next to a value: opens the exact source link in a new tab ("fonte sempre a um clique"). */
export function SourceInfo({ source, field }: SourceInfoProps) {
  if (!source) return null;
  const label = `${UI_TEXT.sourceOf(field, source.name)} ${UI_TEXT.external}`;
  return (
    <a className="src" href={source.url} target="_blank" rel="noopener noreferrer" aria-label={label} title={`${source.name} · ${source.license}`}>
      i
    </a>
  );
}
