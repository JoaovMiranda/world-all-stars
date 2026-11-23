/** What the root head needs to know about the matched routes (router-internal flags included). */
export interface HeadMatch {
  status: string;
  _notFound?: boolean | undefined;
  globalNotFound?: boolean | undefined;
}
