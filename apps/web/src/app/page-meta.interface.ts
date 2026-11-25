import type { JsonLd } from '@was/shared';

/** What a route loader returns for its <head> (serializable: it travels in the dehydrated router state). */
export interface PageMeta {
  title: string;
  description?: string | undefined;
  /** Title used as is (home), otherwise " · World All Stars" is appended. */
  fullTitle?: boolean;
  /** Account/admin pages: kept out of search engines. */
  noindex?: boolean;
  /** Commons image for Open Graph / Twitter cards (athlete photo, sport image); shown via the proxy when licensed. */
  image?: string | undefined;
  /** License short name of `image` ("CC BY-SA 4.0"): without a free license the default card is used (T4.5). */
  imageLicense?: string | null | undefined;
  /** Query kept in the canonical URL (content filters, page > 1; never sort-only params): `?belt=black`. */
  canonicalSearch?: string | undefined;
  /** schema.org nodes (built with the @was/shared SEO helpers), emitted as JSON-LD with the CSP nonce. */
  jsonLd?: JsonLd[];
}
