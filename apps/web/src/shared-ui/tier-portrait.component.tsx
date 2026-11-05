import './tier-portrait.css';

import type { MediaLink, Tier } from '@was/shared';
import { type CSSProperties, useState } from 'react';

import { initials } from './format.helper';
import { UI_TEXT } from './ui-text.const';

interface TierPortraitProps {
  name: string;
  tier: Tier;
  /** Commons image by link (never stored); initials when missing or broken. */
  photo: MediaLink | null;
  /** Width in px (height follows 4:5). Default 168. */
  width?: number;
}

/** Big 4:5 portrait framed by the tier metal, with the photo credit (year · author · license link) on top. */
export function TierPortrait({ name, tier, photo, width }: TierPortraitProps) {
  const [broken, setBroken] = useState(false);
  const credit = photo && [photo.year, photo.author].filter(Boolean).join(' · ');
  return (
    <figure className={`tier-portrait tier-portrait-${tier}`} style={width ? ({ '--portrait-w': `${width}px` } as CSSProperties) : undefined}>
      {photo && !broken && (
        <img src={photo.url} alt={name} width={168} height={210} fetchPriority="high" decoding="async" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
      )}
      <span className="tier-portrait-fallback" aria-hidden="true">
        {initials(name)}
      </span>
      {photo && !broken && (
        <figcaption className="theme-stage">
          {credit}
          {photo.license && (
            <>
              {credit ? ' · ' : ''}
              {photo.page ? (
                <a href={photo.page} target="_blank" rel="noopener noreferrer">
                  {photo.license}
                  <span className="sr-only"> {UI_TEXT.external}</span>
                </a>
              ) : (
                photo.license
              )}
            </>
          )}
        </figcaption>
      )}
    </figure>
  );
}
