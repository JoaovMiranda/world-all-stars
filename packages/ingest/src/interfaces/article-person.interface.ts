/** An athlete with an English Wikipedia article, as read for the biography/enrichment input. */
export interface ArticlePerson {
  id: string;
  name: string;
  full_name: string | null;
  birth_date: string | null;
  height_cm: number | null;
  /** Wikipedia (en) title. */
  title: string;
}
