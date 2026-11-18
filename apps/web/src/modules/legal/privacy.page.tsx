import { LEGAL_DOCUMENT_VERSIONS } from '@was/shared';

import { useLocalized } from '@/i18n/use-localized.hook';
import { useText } from '@/i18n/use-text.hook';
import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';

import { ContactMessageLink, PrivacyRightsLinks, RelatedLegalLinks } from './legal-links.component';
import { LEGAL_DOCS, LEGAL_MESSAGES } from './legal.const';

/** P19 Privacy notice (doc 13). */
export function PrivacyPage() {
  const doc = useLocalized(LEGAL_DOCS).privacy;
  const t = useText(LEGAL_MESSAGES);
  const sections = withSectionExtras(doc.sections, {
    canal: <ContactMessageLink />,
    cookies: <RelatedLegalLinks show={['cookies']} />,
    direitos: <PrivacyRightsLinks />,
  });
  return <DocumentPageLayout {...doc} {...LEGAL_DOCUMENT_VERSIONS.privacy} sections={sections} notice={t.draftNotice} />;
}
