import {
  buildImageSitemapXml,
  buildRobotsTxt,
  buildSitemapIndexXml,
  buildSitemapXml,
  competitionEditionPath,
  competitionPath,
  editionKeys,
  groupBy,
  licenseUrl,
  PUBLIC_STATIC_PATHS,
  SITEMAP_PATHS,
  type SitemapImageUrl,
  type SitemapUrl,
} from '@was/shared';
import type { Context, Hono } from 'hono';

import { CACHE_CONTROL } from '../consts/cache-control.const';
import type { HonoEnv } from '../http/app-context.type';
import type { AppDeps } from '../http/app-deps.interface';
import { METHODOLOGY_DOCS } from '../modules/methodologies/methodology-docs.const';
import { SitemapRepository } from './sitemap.repository';
import type { SitemapPathRow } from './sitemap-rows.interface';

type Stamp = Date | string | null | undefined;
const day = (d: Stamp) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);
const latest = (dates: readonly Stamp[]) => {
  const times = dates.filter((d): d is Date | string => !!d).map((d) => new Date(d).getTime());
  return times.length ? day(new Date(Math.max(...times))) : undefined;
};
const xml = (c: Context<HonoEnv>, body: string) =>
  c.body(body, 200, { 'Content-Type': 'application/xml; charset=UTF-8', 'Cache-Control': CACHE_CONTROL.sitemap });

/**
 * robots.txt and sitemaps (doc 12, T4.7), from the same database the API serves (works with the database in dev:api
 * and in production; `pnpm dev` with fixtures still reads the database here). Absolute URLs use PUBLIC_URL; every
 * `lastmod` is the last change of the data the page shows.
 */
export const mountSeo = (app: Hono<HonoEnv>, deps: AppDeps): void => {
  const origin = deps.config.publicUrl;
  const read = () => new SitemapRepository(deps.db);

  /** `/rankings/all-sports`, every published snapshot and every methodology page that has a document. */
  const rankingUrls = async (): Promise<SitemapUrl[]> => {
    const repo = read();
    const [snapshots, publications, crossSport] = await Promise.all([repo.publishedRankings(), repo.methodologyPublications(), repo.crossSportUpdatedAt()]);
    const published = new Map(publications.map((p) => [p.key, p.updatedAt]));
    return [
      { path: '/rankings', lastmod: latest(snapshots.map((s) => s.updatedAt)) },
      { path: '/rankings/all-sports', lastmod: day(crossSport) },
      { path: '/rankings/all-sports/methodology', lastmod: day(crossSport) },
      ...snapshots.map((s) => ({ path: `/rankings/${encodeURIComponent(s.key)}`, lastmod: day(s.updatedAt) })),
      ...METHODOLOGY_DOCS.keys().map((key) => ({ path: `/rankings/${encodeURIComponent(key)}/methodology`, lastmod: day(published.get(key)) })),
    ];
  };

  /** Competition pages and the page of each of their real editions. */
  const competitionUrls = async (): Promise<SitemapUrl[]> => {
    const repo = read();
    const [competitions, editions] = await Promise.all([repo.competitions(), repo.editions()]);
    const byCompetition = groupBy(editions, (e) => e.competition);
    return competitions.flatMap((c: SitemapPathRow) => {
      const list = byCompetition.get(c.key) ?? [];
      const keys = editionKeys(list);
      return [
        { path: competitionPath(c.key), lastmod: day(c.updatedAt) },
        ...list.map((e) => ({ path: competitionEditionPath(c.key, keys.get(e.id)!), lastmod: day(e.updatedAt) })),
      ];
    });
  };

  /** Pages with licensed images (athlete photos, sport images), one entry per page. */
  const imageUrls = async (): Promise<SitemapImageUrl[]> => {
    const rows = await read().images();
    return [...groupBy(rows, (r) => r.path).entries()].map(([path, images]) => ({
      path,
      lastmod: latest(images.map((i) => i.updatedAt)),
      images: images.map((i) => ({ loc: i.url, license: licenseUrl(i.license, i.filePage) })),
    }));
  };

  const todayUrls = async (): Promise<SitemapUrl[]> => (await read().todayDays()).map((d) => ({ path: `/on-this-day/${d.key}`, lastmod: day(d.updatedAt) }));

  app.get('/robots.txt', (c) => c.body(buildRobotsTxt(origin), 200, { 'Content-Type': 'text/plain; charset=UTF-8', 'Cache-Control': CACHE_CONTROL.sitemap }));

  app.get(SITEMAP_PATHS.index, async (c) => {
    const { athletes, sports } = (await deps.catalog.get()).sitemapEntries();
    const [rankings, competitions, images, today] = await Promise.all([rankingUrls(), competitionUrls(), imageUrls(), todayUrls()]);
    const newest = (urls: readonly SitemapUrl[]) => latest(urls.map((u) => u.lastmod));
    return xml(
      c,
      buildSitemapIndexXml(origin, [
        { path: SITEMAP_PATHS.static },
        { path: SITEMAP_PATHS.athletes, lastmod: latest(athletes.map((a) => a.updatedAt)) },
        { path: SITEMAP_PATHS.sports, lastmod: latest(sports.map((s) => s.updatedAt)) },
        { path: SITEMAP_PATHS.rankings, lastmod: newest(rankings) },
        { path: SITEMAP_PATHS.competitions, lastmod: newest(competitions) },
        { path: SITEMAP_PATHS.images, lastmod: newest(images) },
        { path: SITEMAP_PATHS.today, lastmod: newest(today) },
      ]),
    );
  });
  app.get(SITEMAP_PATHS.static, (c) =>
    xml(
      c,
      buildSitemapXml(
        origin,
        PUBLIC_STATIC_PATHS.map((path): SitemapUrl => ({ path })),
      ),
    ),
  );
  app.get(SITEMAP_PATHS.athletes, async (c) => {
    const { athletes } = (await deps.catalog.get()).sitemapEntries();
    return xml(
      c,
      buildSitemapXml(
        origin,
        athletes.map((a) => ({ path: `/athletes/${a.slug}`, lastmod: day(a.updatedAt) })),
      ),
    );
  });
  app.get(SITEMAP_PATHS.sports, async (c) => {
    const { sports } = (await deps.catalog.get()).sitemapEntries();
    return xml(
      c,
      buildSitemapXml(
        origin,
        sports.map((s) => ({ path: `/sports/${s.slug}`, lastmod: day(s.updatedAt) })),
      ),
    );
  });
  app.get(SITEMAP_PATHS.rankings, async (c) => xml(c, buildSitemapXml(origin, await rankingUrls())));
  app.get(SITEMAP_PATHS.competitions, async (c) => xml(c, buildSitemapXml(origin, await competitionUrls())));
  app.get(SITEMAP_PATHS.images, async (c) => xml(c, buildImageSitemapXml(origin, await imageUrls())));
  app.get(SITEMAP_PATHS.today, async (c) => xml(c, buildSitemapXml(origin, await todayUrls())));
};
