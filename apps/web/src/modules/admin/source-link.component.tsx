import type { SourceRef } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';

import { ADMIN_MESSAGES } from './admin.const';

/** External link to the exact source used (name + license), or "No source". */
export function SourceLink({ source }: { source: SourceRef | null }) {
  const adminText = useText(ADMIN_MESSAGES);
  if (!source) return <span className="muted">{adminText.common.noSource}</span>;
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={adminText.common.sourceLink(source.name)} className="admin-wrap">
      {source.name} ↗ <small className="muted">· {source.license}</small>
    </a>
  );
}
