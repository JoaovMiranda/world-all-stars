/** One sport image chosen from Wikimedia Commons (Wikidata P18 of the sport item), with what attribution needs. */
export interface SportImage {
  /** Sport slug (sports.slug). */
  sport: string;
  /** Wikidata item of the sport. */
  qid: string;
  /** Commons file name ("Football in Bloomington, Indiana, 1995.jpg"). */
  file: string;
  /** Original upload URL (upload.wikimedia.org). */
  url: string;
  /** Pre-rendered thumbnail URL (shown through the /img/wm proxy). */
  thumbUrl: string;
  /** File description page on Commons (the attribution link). */
  page: string;
  author: string | null;
  /** License short name as Commons reports it ("CC BY-SA 4.0", "Public domain"). */
  license: string;
  licenseUrl: string | null;
  year: number | null;
}
