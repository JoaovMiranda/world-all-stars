/** One biography generation plus its deterministic validation (levels 0–3). */
export interface BiographyAttempt {
  /** Whether the model answered with a schema-valid biography. */
  valid: boolean;
  /** Claims with the cited sentence ID (null for a quote-text citation) and the literal quote inserted by the code. */
  checked: { text: string; evidence_id: string | null; evidence_quote: string; literal: boolean }[];
  level: 0 | 1 | 2 | 3;
  copied: boolean;
  /** The longest run of 12+ words bio_en shares with SOURCE (null when original). */
  copiedRun: string | null;
  invocationId: string;
  output: unknown;
  error: string | null;
  tokens: { tokensIn: number; tokensOut: number };
  bio: { bio_en: string; bio_pt: string; bio_es: string } | null;
}
