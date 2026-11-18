import { useText } from '@/i18n/use-text.hook';

import type { OrgIdentity } from './org.type';
import { UI_MESSAGES } from './ui-text.const';

/** Organization name: link to Wikipedia (new tab) when available, plain bold text otherwise. */
export function OrgName({ org }: { org: OrgIdentity }) {
  const ui = useText(UI_MESSAGES);
  if (!org.wikipedia) return <b className="org-name-plain">{org.name}</b>;
  return (
    <a className="org-name" href={org.wikipedia} target="_blank" rel="noopener noreferrer">
      {org.name}
      <span className="ext" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only"> ({ui.wikipedia})</span>
    </a>
  );
}
