import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';

import { ContactMessageLink } from './legal-links.component';
import { ACCESSIBILITY_AUDITED_AT, ACCESSIBILITY_DOC, LEGAL_TEXT } from './legal.const';

const sections = withSectionExtras(ACCESSIBILITY_DOC.sections, { relatar: <ContactMessageLink label={LEGAL_TEXT.actions.contact} /> });

/** P19 Accessibility statement (doc 14). */
export function AccessibilityPage() {
  return <DocumentPageLayout {...ACCESSIBILITY_DOC} updatedAt={ACCESSIBILITY_AUDITED_AT} sections={sections} />;
}
