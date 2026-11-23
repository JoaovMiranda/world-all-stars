import type { ContentLang } from '../types/content-lang.type';

/** Shape of data/content/sport-sections.json. */
export interface SportContent {
  sports: Record<string, { sources: string[]; certainty: string; sections: ({ key: string } & Partial<Record<ContentLang, [string, string]>>)[] }>;
}
