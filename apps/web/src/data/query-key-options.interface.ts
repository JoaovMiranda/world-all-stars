export interface QueryKeyOptions {
  /** false only for GET /api/session itself: it is what tells the identity (the other keys carry it). */
  keyedByIdentity?: boolean;
}
