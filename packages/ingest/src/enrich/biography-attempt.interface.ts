/** One biography generation plus its deterministic validation (levels 0–3). */
export interface BiographyAttempt {
  /** Whether the model answered with a schema-valid biography. */
  valid: boolean;
  checked: { text: string; evidence_quote: string; literal: boolean }[];
  level: 0 | 1 | 2 | 3;
  copied: boolean;
  invocationId: string;
  output: unknown;
  error: string | null;
  tokens: { tokensIn: number; tokensOut: number };
  bio: { bio_en: string; bio_pt: string; bio_es: string } | null;
}
