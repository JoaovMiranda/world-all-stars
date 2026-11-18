import { describe, expect, it } from 'vitest';

import { breadcrumbJsonLd, itemListJsonLd, organizationJsonLd, serializeJsonLd, siteUrl, webSiteJsonLd } from './json-ld.helper';
import { ROBOTS_DISALLOW } from './seo.const';
import { buildRobotsTxt, buildSitemapIndexXml, buildSitemapXml } from './sitemap.helper';

const ORIGIN = 'https://example.org';

describe('json-ld', () => {
  it('builds the home graph (WebSite with search, Organization)', () => {
    const site = webSiteJsonLd(ORIGIN);
    expect(site['@type']).toBe('WebSite');
    expect((site.potentialAction as { target: { urlTemplate: string } }).target.urlTemplate).toBe('https://example.org/athletes?q={search_term_string}');
    expect(organizationJsonLd(ORIGIN)).toMatchObject({ '@type': 'Organization', url: 'https://example.org/' });
  });

  it('numbers breadcrumbs and list items from 1 with absolute URLs', () => {
    const crumbs = breadcrumbJsonLd(ORIGIN, [{ name: 'Início', path: '/' }, { name: 'Pelé' }]);
    expect(crumbs.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://example.org/' },
      { '@type': 'ListItem', position: 2, name: 'Pelé' },
    ]);
    expect(itemListJsonLd(ORIGIN, 'Atletas', [{ name: 'Pelé', path: '/athletes/pele' }]).itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Pelé', url: 'https://example.org/athletes/pele' },
    ]);
  });

  it('serializes without anything that could close the <script>', () => {
    const out = serializeJsonLd({ '@type': 'Thing', name: '</script><b>&' });
    expect(out).not.toMatch(/[<>&]/);
    expect(JSON.parse(out).name).toBe('</script><b>&');
  });

  it('joins origin and path', () => expect(siteUrl('https://example.org/', '/a')).toBe('https://example.org/a'));
});

describe('sitemap and robots', () => {
  it('writes absolute, escaped <loc> with lastmod', () => {
    const xml = buildSitemapXml(ORIGIN, [{ path: '/athletes/a&b', lastmod: '2026-11-01' }, { path: '/' }]);
    expect(xml).toContain('<loc>https://example.org/athletes/a&amp;b</loc><lastmod>2026-11-01</lastmod>');
    expect(xml).toContain('<url><loc>https://example.org/</loc></url>');
    expect(buildSitemapIndexXml(ORIGIN, [{ path: '/sitemaps/static.xml' }])).toContain('<sitemapindex');
  });

  it('robots blocks private areas and filtered URLs and lists the sitemap', () => {
    const robots = buildRobotsTxt(ORIGIN);
    for (const p of ROBOTS_DISALLOW) expect(robots).toContain(`Disallow: ${p}`);
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Sitemap: https://example.org/sitemap.xml');
  });
});
