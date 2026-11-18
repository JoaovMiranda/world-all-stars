import { type CSSProperties, useState } from 'react';

import { initials } from './format.helper';
import type { OrgIdentity } from './org.type';
import { ResponsiveImg } from './responsive-img.component';

/** Organization logo by link (Wikipedia/Commons); without image (or broken) → initials. Decorative. */
export function OrgLogo({ org, size = 28 }: { org: OrgIdentity; size?: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="org-logo" style={{ '--size': `${size}px` } as CSSProperties} aria-hidden="true">
      {org.image && !broken ? <ResponsiveImg url={org.image} displayWidth={size} width={size} height={size} loading="lazy" onBroken={() => setBroken(true)} /> : initials(org.name)}
    </span>
  );
}
