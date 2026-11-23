// Wikimedia Commons images are hotlinked (doc 02: never copied). The stored URL is the original file (often several
// MB) or a 960px thumbnail, while the UI shows it at 32–300 px. These helpers ask Commons for a thumbnail of the
// displayed size instead: same image, a fraction of the bytes. Other hosts (Google profile photos…) pass through.

import { WIKIMEDIA_STEPS, type WikimediaFile, wikimediaFile, wikimediaStep } from '@was/shared';
import type { ImageVia } from './image-via.type';
import type { ResponsiveSource } from './responsive-source.interface';

export { WIKIMEDIA_STEPS, wikimediaFile, wikimediaStep };

/**
 * `src`/`srcSet` for an image shown at a fixed `width` (avatars, logos, portraits: steps from 1x to 2x, `sizes` = width), or — with `sizes` — at a fluid
 * width (cards: every step up to `maxWidth`, the browser picks). Non-Commons URLs are returned as is.
 */
export const responsiveSource = (url: string, width: number, fluid?: { sizes: string; maxWidth: number }, via: ImageVia = 'direct'): ResponsiveSource => {
  const found = wikimediaFile(url);
  if (!found) return { src: url };
  const file: Pick<WikimediaFile, 'original' | 'thumb'> = via === 'proxy' ? { original: found.original, thumb: (w) => found.proxied(wikimediaStep(w)) } : found;
  if (fluid) {
    const steps = WIKIMEDIA_STEPS.filter((s) => s <= wikimediaStep(fluid.maxWidth));
    return {
      src: file.thumb(wikimediaStep(width)),
      srcSet: steps.map((s) => `${file.thumb(s)} ${s}w`).join(', '),
      sizes: fluid.sizes,
      fallback: file.original,
    };
  }
  // w-descriptors (not 1x/2x) with sizes = the shown width: on a 1.75x phone a 251px portrait needs 440px, so the
  // browser takes the 500px step instead of jumping to the 960px "2x" one (3× the bytes of the LCP image).
  const one = wikimediaStep(width);
  const steps = WIKIMEDIA_STEPS.filter((s) => s >= one && s <= wikimediaStep(width * 2));
  return {
    src: file.thumb(one),
    ...(steps.length > 1 ? { srcSet: steps.map((s) => `${file.thumb(s)} ${s}w`).join(', '), sizes: `${width}px` } : {}),
    fallback: file.original,
  };
};
