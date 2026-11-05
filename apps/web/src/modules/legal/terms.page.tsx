import { LEGAL_DOCUMENT_VERSIONS } from '@was/shared';

import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';

import { ContactMessageLink, RelatedLegalLinks } from './legal-links.component';
import { LEGAL_TEXT, TERMS_DOC } from './legal.const';

const sections = withSectionExtras(TERMS_DOC.sections, {
  servico: <RelatedLegalLinks show={['privacy', 'cookies']} />,
  remocao: <ContactMessageLink label={LEGAL_TEXT.actions.contactPrivacy} />,
});

/** P19 Terms of use (doc 13). */
export function TermsPage() {
  return <DocumentPageLayout {...TERMS_DOC} {...LEGAL_DOCUMENT_VERSIONS.terms} sections={sections} notice={LEGAL_TEXT.draftNotice} />;
}
