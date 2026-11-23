/** A biography proposal as stored in ai_extraction_queue.result_json. */
export interface BiographyResult {
  type: 'biography';
  en: string;
  pt: string;
  es: string;
  claims: { evidence_quote: string; literal?: boolean }[];
}
