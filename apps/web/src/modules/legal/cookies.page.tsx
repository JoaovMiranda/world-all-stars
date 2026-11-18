import { LEGAL_DOCUMENT_VERSIONS } from '@was/shared';

import { useLocalized } from '@/i18n/use-localized.hook';
import { useText } from '@/i18n/use-text.hook';
import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';

import { RelatedLegalLinks } from './legal-links.component';
import { LEGAL_DOCS, LEGAL_MESSAGES } from './legal.const';

/** P19 Cookies policy (doc 13). */
export function CookiesPage() {
  const doc = useLocalized(LEGAL_DOCS).cookies;
  const t = useText(LEGAL_MESSAGES);
  const sections = withSectionExtras(doc.sections, { escolhas: <RelatedLegalLinks show={['privacy']} /> });
  return <DocumentPageLayout {...doc} {...LEGAL_DOCUMENT_VERSIONS.cookies} sections={sections} notice={t.draftNotice} />;
}
