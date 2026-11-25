import type { SitemapUrl } from './sitemap-url.interface';

/** A page of the image sitemap with the images it shows (Google image extension). */
export interface SitemapImageUrl extends SitemapUrl {
  images: readonly {
    /** Absolute URL of the image file. */
    loc: string;
    /** URL of the image license (or of the file page that states it). */
    license?: string | null | undefined;
  }[];
}
