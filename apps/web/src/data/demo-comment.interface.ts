export interface DemoComment {
  id: string;
  slug: string;
  parentId: string | null;
  body: string;
  author: string;
  at: string;
}
