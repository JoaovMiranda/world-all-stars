/** A sport left without an image, and why (no P18, license not allowed, file metadata missing…). */
export interface SportImageMiss {
  sport: string;
  qid: string | null;
  reason: string;
}
