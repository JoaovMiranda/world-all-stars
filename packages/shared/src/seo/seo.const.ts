/** Brand used in titles, Open Graph and structured data. */
export const SITE_NAME = 'World All Stars';
export const SITE_LANGUAGE = 'pt-BR';

/** Public pages with fixed paths, listed in /sitemaps/static.xml (entity pages come from the catalog). */
export const PUBLIC_STATIC_PATHS = [
  '/',
  '/athletes',
  '/sports',
  '/hall-of-greats',
  '/sources',
  '/contact',
  '/about/criteria',
  '/accessibility',
  '/legal/privacy',
  '/legal/terms',
  '/legal/cookies',
] as const;

/** Pages that depend on the session (account, admin): never indexed, never cached by shared caches. */
export const PRIVATE_PATH_PREFIXES = ['/admin', '/me'] as const;
/** Query params that personalize a page (simulated session, fixture mode): such URLs are never shared/indexed. */
export const PERSONAL_QUERY_PARAMS = ['as', 'fixture'] as const;

/** Never indexed (session-dependent, the API, or filtered/search views duplicating the base page). */
export const ROBOTS_DISALLOW = [...PRIVATE_PATH_PREFIXES, '/api/', '/*?*q=', ...PERSONAL_QUERY_PARAMS.map((p) => `/*?*${p}=`)] as const;

/** Paths of the sitemap index and of each per-type sitemap. */
export const SITEMAP_PATHS = {
  index: '/sitemap.xml',
  static: '/sitemaps/static.xml',
  athletes: '/sitemaps/athletes.xml',
  sports: '/sitemaps/sports.xml',
} as const;
