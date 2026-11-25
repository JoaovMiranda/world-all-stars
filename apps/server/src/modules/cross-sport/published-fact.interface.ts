import type { RecognitionFact } from '@was/ranking';

/** A published recognition grant of a public athlete, with the display fields of the readouts. */
export interface PublishedFact extends RecognitionFact {
  /** Definition name in the request locale (English, then the slug, as fallbacks). */
  label: string;
  sportName: string | null;
  competitorName: string;
  competitorSlug: string;
  gender: string | null;
}
