/** Hosts that make a suggestion "automatically checkable" (doc 21): without them the review is manual. */
export const WIKI_SOURCE_HOST_REGEX = /(^|\.)(wikipedia\.org|wikidata\.org)$/;
/** Hostnames never accepted as source links (anti-SSRF, doc 05/21). IPs and dotless hosts are refused by rule. */
export const FORBIDDEN_SOURCE_HOSTS = ['localhost'] as const;
