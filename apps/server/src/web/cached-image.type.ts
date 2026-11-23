/** One proxied thumbnail kept in memory: the bytes, their content type and a strong validator. */
export type CachedImage = {
  body: ArrayBuffer;
  type: string;
  etag: string;
};
