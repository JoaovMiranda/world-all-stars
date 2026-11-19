/** Whether a worker may fetch a source (B01/B05). */
export const CrawlPolicy = {
  Allowed: 'allowed',
  ApiOnly: 'api_only',
  LinkOnly: 'link_only',
  Forbidden: 'forbidden',
} as const;
export type CrawlPolicy = (typeof CrawlPolicy)[keyof typeof CrawlPolicy];
export const CRAWL_POLICY_VALUES = Object.values(CrawlPolicy) as [CrawlPolicy, ...CrawlPolicy[]];
