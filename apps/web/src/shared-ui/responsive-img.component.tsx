import { type ImgHTMLAttributes, useState } from 'react';

import { DATA_SOURCE } from '@/data/data-layer.const';

import { responsiveSource } from './image-src.helper';

type ResponsiveImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'sizes' | 'onError'> & {
  url: string;
  /** Displayed width in CSS px (fixed) or the typical width (fluid, with `fluid`). */
  displayWidth: number;
  /** Fluid images (cards): `sizes` for the browser and the widest it is ever shown. */
  fluid?: { sizes: string; maxWidth: number };
  /** Called when even the original URL fails (the caller shows initials instead). */
  onBroken?: () => void;
};

/**
 * <img> that asks Wikimedia for a thumbnail of the displayed size (srcset 1x/2x or w-descriptors). If the thumbnail
 * fails it retries the original URL once, then reports `onBroken`. Hotlinked: no referrer, no cookies, async decoding.
 */
export function ResponsiveImg({ url, displayWidth, fluid, onBroken, ...img }: ResponsiveImgProps) {
  const [useOriginal, setUseOriginal] = useState(false);
  // With the real API the thumbnails go through the server proxy; the fallback is always the Commons original.
  const source = responsiveSource(url, displayWidth, fluid, DATA_SOURCE === 'http' ? 'proxy' : 'direct');
  const attrs = useOriginal || !source.fallback ? { src: source.fallback ?? source.src } : { src: source.src, srcSet: source.srcSet, sizes: source.sizes };
  return (
    <img
      alt=""
      referrerPolicy="no-referrer"
      // Anonymous CORS (Commons answers Access-Control-Allow-Origin: *): no cookies sent or stored, so the hotlinked
      // photos set no third-party cookie (WMF-Uniq) on our visitors.
      crossOrigin="anonymous"
      decoding="async"
      {...img}
      {...attrs}
      onError={() => (source.fallback && !useOriginal ? setUseOriginal(true) : onBroken?.())}
    />
  );
}
