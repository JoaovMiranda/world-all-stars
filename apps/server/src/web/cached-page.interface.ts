export interface CachedPage {
  status: number;
  headers: [string, string][];
  body: string;
  etag: string;
  /** The CSP nonce baked into `body`: the response header must carry the same one. */
  nonce: string;
  expiresAt: number;
}
