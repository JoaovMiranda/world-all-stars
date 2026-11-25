import frauncesLatin from '@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url';
import manropeLatin from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';
import { LOCALE_OG, serializeJsonLd } from '@was/shared';

import { DATA_SOURCE } from '@/data/data-layer.const';
import { localeStore } from '@/i18n/locale.store';
import { currentText } from '@/i18n/text-for.helper';
import { ERRORS_MESSAGES } from '@/modules/errors/errors.const';
import { LAYOUT_MESSAGES } from '@/shared-ui/layout.const';
import type { HeadMatch } from './head-match.interface';
import { ogImageUrl } from './og-image.helper';
import type { PageMeta } from './page-meta.interface';
import { getBoot } from './request-scope';

/** 404 and error pages: their own title, never indexed (the HTTP status is set by the router). */
const outcomeMeta = (matches: readonly HeadMatch[]): PageMeta | undefined => {
  const errors = currentText(ERRORS_MESSAGES);
  if (matches.some((m) => m.status === 'notFound' || m._notFound || m.globalNotFound)) return { title: errors.notFound.title, noindex: true };
  if (matches.some((m) => m.status === 'error')) return { title: errors.generic.title, noindex: true };
  return undefined;
};

/** Tags shared by every page (root route). Pages add title/description/canonical through `buildHead`. */
export const rootHead = ({ matches }: { matches: readonly HeadMatch[] }) => {
  const layout = currentText(LAYOUT_MESSAGES);
  const outcome = outcomeMeta(matches);
  return {
    meta: [...baseMeta(), ...(outcome ? [{ title: `${outcome.title} · ${layout.brand}` }, { name: 'robots', content: 'noindex' }] : [{ title: layout.brand }])],
    links: baseLinks,
  };
};

/** Re-evaluated on every head() run: a language switch (router.invalidate) updates description and og:locale. */
const baseMeta = () => {
  const layout = currentText(LAYOUT_MESSAGES);
  return [
    { charSet: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { name: 'color-scheme', content: 'light dark' },
    { name: 'description', content: layout.description },
    { property: 'og:site_name', content: layout.brand },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: LOCALE_OG[localeStore.get()] },
  ];
};
const baseLinks = [
  { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
  // Self-hosted fonts (styles.css): the two latin files used above the fold start downloading with the HTML, not
  // after the stylesheet is parsed. Same hashed URLs the @font-face rules point to, so nothing is fetched twice.
  { rel: 'preload', href: manropeLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' as const },
  { rel: 'preload', href: frauncesLatin, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' as const },
  // Fixture mode only: photos come straight from Wikimedia Commons, so open that connection while the HTML parses
  // (crossorigin matches ResponsiveImg's anonymous requests). With the real API they come from our own /img/wm proxy.
  ...(DATA_SOURCE === 'http' ? [] : [{ rel: 'preconnect', href: 'https://upload.wikimedia.org', crossOrigin: 'anonymous' as const }]),
];

/** Title, description, canonical and Open Graph of one page (canonical = PUBLIC_URL + path + `meta.canonicalSearch`). */
export const buildHead = (meta: PageMeta | undefined, pathname: string) => {
  const layout = currentText(LAYOUT_MESSAGES);
  if (!meta) return {};
  const title = meta.fullTitle ? meta.title : `${meta.title} · ${layout.brand}`;
  const url = `${getBoot().publicUrl}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}${meta.canonicalSearch ?? ''}`;
  const description = meta.description ?? layout.description;
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      // Every page has a large card: its licensed Commons image via the proxy, else the default 1200×630 (T4.5).
      { name: 'twitter:card', content: 'summary_large_image' },
      { property: 'og:image', content: ogImageUrl(getBoot().publicUrl, meta.image, meta.imageLicense) },
      ...(meta.noindex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
    links: meta.noindex ? [] : [{ rel: 'canonical', href: url }],
    scripts: (meta.jsonLd ?? []).map((node) => ({ type: 'application/ld+json', children: serializeJsonLd(node) })),
  };
};
