import type { Locale, MarkdownDocument } from '@was/shared';

/** Parsed METHODOLOGY.md of one methodology: the English source plus the translations found next to it. */
export interface MethodologyDocSource {
  key: string;
  /** Parsed documents by language (`en` always; `pt-BR` / `es` from METHODOLOGY.pt-BR.md / METHODOLOGY.es.md). */
  documents: Partial<Record<Locale, MarkdownDocument>>;
}
