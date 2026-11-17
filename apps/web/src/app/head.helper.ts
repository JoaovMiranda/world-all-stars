import { LAYOUT_TEXT } from '@/shared-ui/layout.const';

import { getBoot } from './request-scope';

/** What a route loader returns for its <head> (serializable: it travels in the dehydrated router state). */
export interface PageMeta {
  title: string;
  description?: string | undefined;
  /** Title used as is (home), otherwise " · World All Stars" is appended. */
  fullTitle?: boolean;
  /** Account/admin pages: kept out of search engines. */
  noindex?: boolean;
}

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..600&family=Manrope:wght@400;500;600;700&display=swap';

/** Tags shared by every page (root route). Pages add title/description/canonical through `buildHead`. */
export const rootHead = () => ({
  meta: [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'color-scheme', content: 'light dark' },
    { name: 'description', content: LAYOUT_TEXT.description },
    { property: 'og:site_name', content: LAYOUT_TEXT.brand },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: 'pt_BR' },
    { title: LAYOUT_TEXT.brand },
  ],
  links: [
    { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' as const },
    { rel: 'stylesheet', href: FONTS_URL },
  ],
});

/** Title, description, canonical and Open Graph of one page (canonical = PUBLIC_URL + path, without the search). */
export const buildHead = (meta: PageMeta | undefined, pathname: string) => {
  if (!meta) return {};
  const title = meta.fullTitle ? meta.title : `${meta.title} · ${LAYOUT_TEXT.brand}`;
  const url = `${getBoot().publicUrl}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
  const description = meta.description ?? LAYOUT_TEXT.description;
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      ...(meta.noindex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
    links: meta.noindex ? [] : [{ rel: 'canonical', href: url }],
  };
};
