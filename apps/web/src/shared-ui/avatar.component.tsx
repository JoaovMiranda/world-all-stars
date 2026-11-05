import type { Tier } from '@was/shared';
import { type CSSProperties, useState } from 'react';

import { cx } from './class-names.helper';
import { initials } from './format.helper';

interface AvatarProps {
  name: string;
  /** Colored ring by tier (gold double ring for Mítico). */
  tier?: Tier;
  /** Image by link only (Commons); falls back to initials when missing or broken. */
  photoUrl?: string | null;
  size?: number;
  /** Decorative when the name is already next to it (default). */
  decorative?: boolean;
}

/** Round portrait with tier ring. Images never stored: hotlinked with referrerpolicy=no-referrer. */
export function Avatar({ name, tier, photoUrl, size = 40, decorative = true }: AvatarProps) {
  const [broken, setBroken] = useState(false);
  const showImage = photoUrl && !broken;
  return (
    <span
      className={cx('avatar', tier && `ring-${tier}`)}
      style={{ '--size': `${size}px` } as CSSProperties}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': name })}
    >
      {showImage ? (
        <img src={photoUrl} alt="" referrerPolicy="no-referrer" loading="lazy" decoding="async" onError={() => setBroken(true)} />
      ) : (
        initials(name)
      )}
    </span>
  );
}
