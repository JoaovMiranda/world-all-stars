import type { ReactNode } from 'react';
import type { DocBlock } from './document-page-layout.component';

export interface DocSection {
  /** Anchor (`#direitos`), also used by the table of contents. */
  id: string;
  title: string;
  blocks?: readonly DocBlock[];
  /** Rich content after the blocks (links, tags, components). */
  children?: ReactNode;
}
