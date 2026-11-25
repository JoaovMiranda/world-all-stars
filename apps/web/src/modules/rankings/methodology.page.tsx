import { getRouteApi, Link } from '@tanstack/react-router';
import { useMemo } from 'react';

import { methodologyDocQuery } from '@/data/endpoints/methodology.query';
import { useText } from '@/i18n/use-text.hook';
import { useContentLang } from '@/shared-ui/content-lang.helper';
import type { DocSection } from '@/shared-ui/doc-section.interface';
import { DocumentPageLayout } from '@/shared-ui/document-page-layout.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { MarkdownBlocks } from './markdown-content.component';
import { METHODOLOGY_MESSAGES } from './methodology.const';
import { splitMarkdownSections } from './methodology.helper';
import { RANKINGS_MESSAGES } from './rankings.const';

const route = getRouteApi('/rankings/$key/methodology');

/** T4.2: public methodology page, the methodology's METHODOLOGY.md (sanitized blocks from the API) as a document. */
export function MethodologyPage() {
  const { key } = route.useParams();
  const t = useText(METHODOLOGY_MESSAGES);
  const names = useText(RANKINGS_MESSAGES).list.methodologies;
  const query = methodologyDocQuery.useQuery({ params: { key } });
  const contentLang = useContentLang(query.data?.contentLocale);

  const sections = useMemo((): DocSection[] => {
    const doc = query.data;
    if (!doc) return [];
    const { intro, sections: parts } = splitMarkdownSections(doc.blocks);
    const introSection: DocSection[] = intro.length
      ? [
          {
            id: 'methodology-summary',
            title: t.intro,
            children: (
              <div lang={contentLang}>
                <MarkdownBlocks blocks={intro} tableCaption={t.tableCaption(t.intro)} />
              </div>
            ),
          },
        ]
      : [];
    const rankings: DocSection = {
      id: 'methodology-rankings',
      title: t.rankingsTitle,
      children: (
        <>
          <p>{t.rankingsLead}</p>
          <ul className="doc-list" lang={contentLang}>
            {doc.rankings.map((r) => (
              <li key={r.key}>
                {r.title} <code>{r.key}</code>
              </li>
            ))}
          </ul>
          <p>
            <Link to="/rankings" search={{ methodology: doc.key }}>
              {t.rankingsLink}
            </Link>
          </p>
        </>
      ),
    };
    return [
      ...introSection,
      ...parts.map((s) => ({
        id: s.id,
        title: s.title,
        lang: contentLang,
        children: <MarkdownBlocks blocks={s.blocks} tableCaption={t.tableCaption(s.title)} />,
      })),
      ...(doc.rankings.length ? [rankings] : []),
    ];
  }, [query.data, t, contentLang]);

  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={8} />} notFound={<EmptyState title={t.notFoundTitle}>{t.notFoundText}</EmptyState>}>
      {(doc) => (
        <DocumentPageLayout
          title={doc.title}
          eyebrow={`${t.eyebrow} · ${names[doc.key] ?? doc.key}`}
          version={doc.version}
          contentLocale={doc.contentLocale}
          breadcrumb={[{ label: t.breadcrumb, link: { to: '/rankings' } }, { label: names[doc.key] ?? doc.key }]}
          sections={sections}
        />
      )}
    </QueryBoundary>
  );
}
