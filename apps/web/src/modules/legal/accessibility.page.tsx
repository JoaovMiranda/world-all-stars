import { useLocalized } from '@/i18n/use-localized.hook';
import { useText } from '@/i18n/use-text.hook';
import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';
import { ACCESSIBILITY_STATEMENT_REVIEWED_AT, LEGAL_DOCS, LEGAL_MESSAGES } from './legal.const';
import { ContactMessageLink } from './legal-links.component';

/** P19 Accessibility statement (doc 14, T4.8): WCAG 2.2 AA target, known limitations, how to report, review date. */
export function AccessibilityPage() {
  const doc = useLocalized(LEGAL_DOCS).accessibility;
  const t = useText(LEGAL_MESSAGES);
  const sections = withSectionExtras(doc.sections, { relatar: <ContactMessageLink label={t.actions.contact} /> });
  return <DocumentPageLayout {...doc} updatedAt={ACCESSIBILITY_STATEMENT_REVIEWED_AT} sections={sections} />;
}
