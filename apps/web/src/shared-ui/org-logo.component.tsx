import { type CSSProperties, useState } from 'react';

import { initials } from './format.helper';
import type { OrgIdentity } from './org.type';

/** Organization logo by link (Wikipedia/Commons); without image (or broken) → initials. Decorative. */
export function OrgLogo({ org, size = 28 }: { org: OrgIdentity; size?: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="org-logo" style={{ '--size': `${size}px` } as CSSProperties} aria-hidden="true">
      {org.image && !broken ? <img src={org.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : initials(org.name)}
    </span>
  );
}
