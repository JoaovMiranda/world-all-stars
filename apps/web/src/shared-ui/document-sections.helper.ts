import type { ReactNode } from 'react';

import type { DocSection } from '@/shared-ui/document-page-layout.component';

/** Appends rich content (links, buttons) to some sections of a const document, by section id. */
export const withSectionExtras = (sections: readonly DocSection[], extras: Readonly<Record<string, ReactNode>>): DocSection[] =>
  sections.map((s) => (extras[s.id] ? { ...s, children: extras[s.id] } : s));
