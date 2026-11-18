import { buildRobotsTxt, buildSitemapIndexXml, buildSitemapXml, PUBLIC_STATIC_PATHS, SITEMAP_PATHS, type SitemapUrl } from '@was/shared';
import type { Context, Hono } from 'hono';

import type { AppDeps, HonoEnv } from '../http/app-context.type';

/** Crawlers may cache these for an hour (CDN too); they are rebuilt from the in-memory catalog. */
const CACHE = 'public, max-age=3600';
const day = (d: Date) => d.toISOString().slice(0, 10);
const xml = (c: Context<HonoEnv>, body: string) => c.body(body, 200, { 'Content-Type': 'application/xml; charset=UTF-8', 'Cache-Control': CACHE });

/**
 * robots.txt and sitemaps (doc 12), from the same catalog the API serves (works with the database in dev:api and in
 * production; `pnpm dev` with fixtures still reads the database here). Absolute URLs use PUBLIC_URL.
 */
export const mountSeo = (app: Hono<HonoEnv>, deps: AppDeps): void => {
  const origin = deps.config.publicUrl;
  const latest = (dates: Date[]) => (dates.length ? day(new Date(Math.max(...dates.map((d) => d.getTime())))) : undefined);

  app.get('/robots.txt', (c) => c.body(buildRobotsTxt(origin), 200, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': CACHE }));

  app.get(SITEMAP_PATHS.index, async (c) => {
    const { athletes, sports } = (await deps.catalog.get()).sitemapEntries();
    return xml(
      c,
      buildSitemapIndexXml(origin, [
        { path: SITEMAP_PATHS.static },
        { path: SITEMAP_PATHS.athletes, lastmod: latest(athletes.map((a) => a.updatedAt)) },
        { path: SITEMAP_PATHS.sports, lastmod: latest(sports.map((s) => s.updatedAt)) },
      ]),
    );
  });
  app.get(SITEMAP_PATHS.static, (c) => xml(c, buildSitemapXml(origin, PUBLIC_STATIC_PATHS.map((path): SitemapUrl => ({ path })))));
  app.get(SITEMAP_PATHS.athletes, async (c) => {
    const { athletes } = (await deps.catalog.get()).sitemapEntries();
    return xml(c, buildSitemapXml(origin, athletes.map((a) => ({ path: `/athletes/${a.slug}`, lastmod: day(a.updatedAt) }))));
  });
  app.get(SITEMAP_PATHS.sports, async (c) => {
    const { sports } = (await deps.catalog.get()).sitemapEntries();
    return xml(c, buildSitemapXml(origin, sports.map((s) => ({ path: `/sports/${s.slug}`, lastmod: day(s.updatedAt) }))));
  });
};
