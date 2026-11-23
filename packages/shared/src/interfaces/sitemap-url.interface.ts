export interface SitemapUrl {
  /** Site path (made absolute with the origin). */
  path: string;
  /** YYYY-MM-DD or ISO datetime of the last change. */
  lastmod?: string | undefined;
}
