// Rows of the sitemap read model (aliased SQL columns of SitemapRepository).

export interface SitemapPathRow {
  key: string;
  updatedAt: Date | string | null;
}

export interface SitemapEditionRow {
  id: string;
  competition: string;
  year: number | null;
  number: number | null;
  startDate: string | null;
  updatedAt: Date | string;
}

export interface SitemapImageRow {
  /** Site path of the page that shows the image. */
  path: string;
  url: string;
  license: string | null;
  filePage: string | null;
  updatedAt: Date | string;
}
