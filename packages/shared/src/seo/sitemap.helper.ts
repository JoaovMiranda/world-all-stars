import { ROBOTS_DISALLOW, SITEMAP_PATHS } from './seo.const';
import { siteUrl } from './json-ld.helper';

export interface SitemapUrl {
  /** Site path (made absolute with the origin). */
  path: string;
  /** YYYY-MM-DD or ISO datetime of the last change. */
  lastmod?: string | undefined;
}

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';
const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const entry = (tag: 'url' | 'sitemap', origin: string, u: SitemapUrl) =>
  `<${tag}><loc>${xmlEscape(siteUrl(origin, u.path))}</loc>${u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : ''}</${tag}>`;

/** <urlset> of one sitemap (absolute URLs). */
export const buildSitemapXml = (origin: string, urls: readonly SitemapUrl[]): string =>
  `${XML_HEAD}<urlset xmlns="${NS}">\n${urls.map((u) => entry('url', origin, u)).join('\n')}\n</urlset>\n`;

/** <sitemapindex> pointing at each per-type sitemap. */
export const buildSitemapIndexXml = (origin: string, sitemaps: readonly SitemapUrl[]): string =>
  `${XML_HEAD}<sitemapindex xmlns="${NS}">\n${sitemaps.map((s) => entry('sitemap', origin, s)).join('\n')}\n</sitemapindex>\n`;

/** robots.txt: everything public is crawlable except ROBOTS_DISALLOW; points at the sitemap index. */
export const buildRobotsTxt = (origin: string): string =>
  ['User-agent: *', 'Allow: /', ...ROBOTS_DISALLOW.map((p) => `Disallow: ${p}`), '', `Sitemap: ${siteUrl(origin, SITEMAP_PATHS.index)}`, ''].join('\n');
