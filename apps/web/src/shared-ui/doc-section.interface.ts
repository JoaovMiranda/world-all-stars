import type { ReactNode } from 'react';
import type { DocBlock } from './document-page-layout.component';

export interface DocSection {
  /** Anchor (`#direitos`), also used by the table of contents. */
  id: string;
  title: string;
  blocks?: readonly DocBlock[];
  /** Rich content after the blocks (links, tags, components). */
  children?: ReactNode;
  /** Language of the section when it differs from the page (API content in a fallback language, WCAG 3.1.2). */
  lang?: string | undefined;
}
