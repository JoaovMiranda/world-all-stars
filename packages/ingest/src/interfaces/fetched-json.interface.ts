/** Parsed JSON body of a stored source document. */
export interface FetchedJson<T> {
  data: T;
  documentId: string;
}
