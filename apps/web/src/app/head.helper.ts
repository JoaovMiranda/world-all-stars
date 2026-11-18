import frauncesLatin from '@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2?url';
import manropeLatin from '@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2?url';
import { type JsonLd, LOCALE_OG, serializeJsonLd } from '@was/shared';

import { DATA_SOURCE } from '@/data/data-layer.const';
import { currentText } from '@/i18n/text-for.helper';
import { localeStore } from '@/i18n/locale.store';
import { ERRORS_MESSAGES } from '@/modules/errors/errors.const';
import { LAYOUT_MESSAGES } from '@/shared-ui/layout.const';

import { getBoot } from './request-scope';

/** What a route loader returns for its <head> (serializable: it travels in the dehydrated router state). */
export interface PageMeta {
  title: string;
  description?: string | undefined;
  /** Title used as is (home), otherwise " · World All Stars" is appended. */
  fullTitle?: boolean;
  /** Account/admin pages: kept out of search engines. */
  noindex?: boolean;
  /** Absolute image for Open Graph / Twitter cards (athlete photo). */
  image?: string | undefined;
  /** schema.org nodes (built with the @was/shared SEO helpers), emitted as JSON-LD with the CSP nonce. */
  jsonLd?: JsonLd[];
}

/** What the root head needs to know about the matched routes (router-internal flags included). */
interface HeadMatch {
  status: string;
  _notFound?: boolean | undefined;
  globalNotFound?: boolean | undefined;
}

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

/** Title, description, canonical and Open Graph of one page (canonical = PUBLIC_URL + path, without the search). */
export const buildHead = (meta: PageMeta | undefined, pathname: string) => {
  const layout = currentText(LAYOUT_MESSAGES);
  if (!meta) return {};
  const title = meta.fullTitle ? meta.title : `${meta.title} · ${layout.brand}`;
  const url = `${getBoot().publicUrl}${pathname === '/' ? '/' : pathname.replace(/\/+$/, '')}`;
  const description = meta.description ?? layout.description;
  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { name: 'twitter:card', content: meta.image ? 'summary_large_image' : 'summary' },
      ...(meta.image ? [{ property: 'og:image', content: meta.image }] : []),
      ...(meta.noindex ? [{ name: 'robots', content: 'noindex' }] : []),
    ],
    links: meta.noindex ? [] : [{ rel: 'canonical', href: url }],
    scripts: (meta.jsonLd ?? []).map((node) => ({ type: 'application/ld+json', children: serializeJsonLd(node) })),
  };
};
