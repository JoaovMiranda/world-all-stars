import type { SourceRef } from '@was/shared';

import { ADMIN_TEXT } from './admin.const';

/** External link to the exact source used (name + license), or "Sem fonte". */
export function SourceLink({ source }: { source: SourceRef | null }) {
  if (!source) return <span className="muted">{ADMIN_TEXT.common.noSource}</span>;
  return (
    <a href={source.url} target="_blank" rel="noopener noreferrer" aria-label={ADMIN_TEXT.common.sourceLink(source.name)} className="admin-wrap">
      {source.name} ↗ <small className="muted">· {source.license}</small>
    </a>
  );
}
