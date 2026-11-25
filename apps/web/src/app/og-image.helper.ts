import { isFreeLicense, wikimediaFile } from '@was/shared';

import { DEFAULT_OG_IMAGE, OG_IMAGE_WIDTH } from './og-image.const';

/**
 * Absolute og:image of a page (T4.5): its Commons image through our same-origin proxy (/img/wm/…) when it is freely
 * licensed (CC0 / PD / CC BY / CC BY-SA), else the site's default card. Non-Commons or unlicensed images never leave.
 */
export const ogImageUrl = (publicUrl: string, image: string | undefined, license: string | null | undefined): string => {
  const file = image && isFreeLicense(license) ? wikimediaFile(image) : null;
  return `${publicUrl}${file ? file.proxied(OG_IMAGE_WIDTH) : DEFAULT_OG_IMAGE.path}`;
};
