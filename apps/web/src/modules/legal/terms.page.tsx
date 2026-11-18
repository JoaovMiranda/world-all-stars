import { LEGAL_DOCUMENT_VERSIONS } from '@was/shared';

import { useLocalized } from '@/i18n/use-localized.hook';
import { useText } from '@/i18n/use-text.hook';
import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';

import { ContactMessageLink, RelatedLegalLinks } from './legal-links.component';
import { LEGAL_DOCS, LEGAL_MESSAGES } from './legal.const';

/** P19 Terms of use (doc 13). */
export function TermsPage() {
  const doc = useLocalized(LEGAL_DOCS).terms;
  const t = useText(LEGAL_MESSAGES);
  const sections = withSectionExtras(doc.sections, {
    servico: <RelatedLegalLinks show={['privacy', 'cookies']} />,
    remocao: <ContactMessageLink label={t.actions.contactPrivacy} />,
  });
  return <DocumentPageLayout {...doc} {...LEGAL_DOCUMENT_VERSIONS.terms} sections={sections} notice={t.draftNotice} />;
}
