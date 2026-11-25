import type { SitemapImageUrl } from '../interfaces/sitemap-image-url.interface';
import type { SitemapUrl } from '../interfaces/sitemap-url.interface';
import { siteUrl } from './json-ld.helper';
import { ROBOTS_DISALLOW, SITEMAP_PATHS } from './seo.const';

const xmlEscape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
const XML_HEAD = '<?xml version="1.0" encoding="UTF-8"?>\n';
const NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
const IMAGE_NS = 'http://www.google.com/schemas/sitemap-image/1.1';
const entry = (tag: 'url' | 'sitemap', origin: string, u: SitemapUrl) =>
  `<${tag}><loc>${xmlEscape(siteUrl(origin, u.path))}</loc>${u.lastmod ? `<lastmod>${xmlEscape(u.lastmod)}</lastmod>` : ''}</${tag}>`;

/** <urlset> of one sitemap (absolute URLs). */
export const buildSitemapXml = (origin: string, urls: readonly SitemapUrl[]): string =>
  `${XML_HEAD}<urlset xmlns="${NS}">\n${urls.map((u) => entry('url', origin, u)).join('\n')}\n</urlset>\n`;

/** <urlset> with the image extension: each page lists the images it shows and their license. */
export const buildImageSitemapXml = (origin: string, pages: readonly SitemapImageUrl[]): string => {
  const image = (i: SitemapImageUrl['images'][number]) =>
    `<image:image><image:loc>${xmlEscape(i.loc)}</image:loc>${i.license ? `<image:license>${xmlEscape(i.license)}</image:license>` : ''}</image:image>`;
  const url = (p: SitemapImageUrl) => entry('url', origin, p).replace('</url>', `${p.images.map(image).join('')}</url>`);
  return `${XML_HEAD}<urlset xmlns="${NS}" xmlns:image="${IMAGE_NS}">\n${pages.map(url).join('\n')}\n</urlset>\n`;
};

/** <sitemapindex> pointing at each per-type sitemap. */
export const buildSitemapIndexXml = (origin: string, sitemaps: readonly SitemapUrl[]): string =>
  `${XML_HEAD}<sitemapindex xmlns="${NS}">\n${sitemaps.map((s) => entry('sitemap', origin, s)).join('\n')}\n</sitemapindex>\n`;

/** robots.txt: everything public is crawlable except ROBOTS_DISALLOW; points at the sitemap index. */
export const buildRobotsTxt = (origin: string): string =>
  ['User-agent: *', 'Allow: /', ...ROBOTS_DISALLOW.map((p) => `Disallow: ${p}`), '', `Sitemap: ${siteUrl(origin, SITEMAP_PATHS.index)}`, ''].join('\n');
