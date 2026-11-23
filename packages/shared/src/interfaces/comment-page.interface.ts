export interface CommentPage {
  /** Id of the last thread of the previous page (the response's `nextCursor`); absent = first page. */
  cursor?: string | undefined;
  limit?: number;
  /** Every visible comment of the athlete (threads + replies); default: the rows given. */
  total?: number;
}
