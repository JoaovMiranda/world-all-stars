export interface DemoComment {
  id: string;
  slug: string;
  parentId: string | null;
  body: string;
  author: string;
  at: string;
  /** Last edit (10-minute window, T3.3). */
  editedAt?: string;
}
