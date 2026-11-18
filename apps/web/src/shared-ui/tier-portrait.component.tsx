import './tier-portrait.css';

import type { MediaLink, Tier } from '@was/shared';
import { type CSSProperties, useRef, useState } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { initials } from './format.helper';
import { ResponsiveImg } from './responsive-img.component';
import { UI_MESSAGES } from './ui-text.const';
import { useTilt } from './use-tilt.hook';

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
  const ui = useText(UI_MESSAGES);
  const [broken, setBroken] = useState(false);
  const ref = useRef<HTMLElement>(null);
  useTilt(ref, 8);
  const credit = photo && [photo.year, photo.author].filter(Boolean).join(' · ');
  return (
    <figure ref={ref} className={`tier-portrait tier-portrait-${tier} tilt tilt-spec`} style={width ? ({ '--portrait-w': `${width}px` } as CSSProperties) : undefined}>
      {photo && !broken && (
        // LCP image of the profile: thumbnail of the shown width (steps 1x→2x by w-descriptor), fetched with high priority, never lazy.
        <ResponsiveImg url={photo.url} displayWidth={width ?? 168} alt={name} width={168} height={210} fetchPriority="high" onBroken={() => setBroken(true)} />
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
                  <span className="sr-only"> {ui.external}</span>
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
