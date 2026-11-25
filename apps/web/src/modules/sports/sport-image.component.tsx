import { type MediaLink, wikimediaFile } from '@was/shared';
import { useState } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { ResponsiveImg } from '@/shared-ui/responsive-img.component';

import { SPORTS_MESSAGES } from './sports.const';

interface SportImageProps {
  image: MediaLink;
  sport: string;
}

/**
 * The sport's Wikimedia Commons image (T4.4), through the /img/wm proxy with the real API, and its visible attribution:
 * author · license · link to the file page on Commons. Hidden when the image cannot be loaded (credit without a photo).
 */
export function SportImage({ image, sport }: SportImageProps) {
  const t = useText(SPORTS_MESSAGES).image;
  const ui = useText(SPORTS_MESSAGES).page;
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  const file = wikimediaFile(image.original)?.file ?? sport;
  return (
    <figure className="sport-image">
      <ResponsiveImg
        url={image.url}
        displayWidth={360}
        fluid={{ sizes: '(max-width: 960px) calc(100vw - 32px), 360px', maxWidth: 960 }}
        alt={t.alt(sport)}
        loading="lazy"
        onBroken={() => setBroken(true)}
      />
      <figcaption className="muted text-sm">
        {t.by} {image.author ?? t.unknownAuthor}
        {image.license && (
          <>
            {' · '}
            <span className="sr-only">{t.license} </span>
            {image.license}
          </>
        )}
        {image.page && (
          <>
            {' · '}
            <a href={image.page} target="_blank" rel="noopener noreferrer" aria-label={`${t.filePage(file)} ${ui.external}`}>
              {t.via}
            </a>
          </>
        )}
      </figcaption>
    </figure>
  );
}
