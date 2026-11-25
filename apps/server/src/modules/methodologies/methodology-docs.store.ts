import fs from 'node:fs';
import path from 'node:path';

import { METHODOLOGIES } from '@was/ranking';
import { CONTENT_SOURCE_LOCALE, LOCALE_VALUES, type Locale, type MarkdownDocument, parseMarkdown } from '@was/shared';

import type { MethodologyDocSource } from './methodology-doc-source.interface';

/** File of a document: METHODOLOGY.md is the English source; translations are METHODOLOGY.<locale>.md. */
const fileName = (locale: Locale) => (locale === CONTENT_SOURCE_LOCALE ? 'METHODOLOGY.md' : `METHODOLOGY.${locale}.md`);

/**
 * Methodology documents read once (server start) from the docs folder and kept parsed in memory: requests never touch
 * the disk. A registered methodology without a METHODOLOGY.md is simply absent (404).
 */
export class MethodologyDocsStore {
  private readonly sources = new Map<string, MethodologyDocSource>();

  constructor(dir: string, keys: readonly string[] = Object.keys(METHODOLOGIES)) {
    for (const key of keys) {
      const documents: MethodologyDocSource['documents'] = {};
      for (const locale of LOCALE_VALUES) {
        const file = path.join(dir, key, fileName(locale));
        if (fs.existsSync(file)) documents[locale] = parseMarkdown(fs.readFileSync(file, 'utf8'));
      }
      if (documents[CONTENT_SOURCE_LOCALE]) this.sources.set(key, { key, documents });
    }
  }

  /** The document in `locale` when translated, else the English source (`locale` says which one came). */
  get(key: string, locale: Locale): { document: MarkdownDocument; locale: Locale } | null {
    const source = this.sources.get(key);
    if (!source) return null;
    const translated = source.documents[locale];
    if (translated) return { document: translated, locale };
    const english = source.documents[CONTENT_SOURCE_LOCALE];
    return english ? { document: english, locale: CONTENT_SOURCE_LOCALE } : null;
  }

  keys(): string[] {
    return [...this.sources.keys()];
  }
}
