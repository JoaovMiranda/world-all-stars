import { LEGAL_DOCUMENT_VERSIONS } from '@was/shared';

import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { withSectionExtras } from '@/shared-ui/document-sections.helper';

import { RelatedLegalLinks } from './legal-links.component';
import { COOKIES_DOC, LEGAL_TEXT } from './legal.const';

const sections = withSectionExtras(COOKIES_DOC.sections, { escolhas: <RelatedLegalLinks show={['privacy']} /> });

/** P19 Cookies policy (doc 13). */
export function CookiesPage() {
  return <DocumentPageLayout {...COOKIES_DOC} {...LEGAL_DOCUMENT_VERSIONS.cookies} sections={sections} notice={LEGAL_TEXT.draftNotice} />;
}
