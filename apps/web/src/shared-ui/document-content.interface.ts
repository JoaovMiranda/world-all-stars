import type { DocSection } from './doc-section.interface';

/** Text shape of a document in a const file (`{ title, eyebrow, lead, sections }`). */
export interface DocumentContent {
  title: string;
  eyebrow?: string;
  lead?: string;
  sections: readonly DocSection[];
}
