import type { JsonLd } from '@was/shared';

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
