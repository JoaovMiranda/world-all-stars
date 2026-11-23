/** A document returned by the SafeFetcher (network or disk cache). */
export interface FetchedDocument {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string | null;
  bytes: Buffer;
  fromCache: boolean;
}
