import { LEGAL_DOCUMENT_VERSIONS } from '@was/shared';

import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';

import { ContactMessageLink, PrivacyRightsLinks, RelatedLegalLinks } from './legal-links.component';
import { LEGAL_TEXT, PRIVACY_DOC } from './legal.const';

const sections = withSectionExtras(PRIVACY_DOC.sections, {
  canal: <ContactMessageLink />,
  cookies: <RelatedLegalLinks show={['cookies']} />,
  direitos: <PrivacyRightsLinks />,
});

/** P19 Privacy notice (doc 13). */
export function PrivacyPage() {
  return <DocumentPageLayout {...PRIVACY_DOC} {...LEGAL_DOCUMENT_VERSIONS.privacy} sections={sections} notice={LEGAL_TEXT.draftNotice} />;
}
