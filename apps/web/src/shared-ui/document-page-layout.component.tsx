import './document-page-layout.css';

import type { IsoDate } from '@was/shared';
import { type ReactNode, useId } from 'react';

import { useText } from '@/i18n/use-text.hook';
import type { BreadcrumbItem } from './breadcrumb-item.interface';
import type { DocSection } from './doc-section.interface';
import type { DocumentContent } from './document-content.interface';
import { DOCUMENT_PAGE_MESSAGES } from './document-page.const';
import { formatDate } from './format.helper';
import { Notice, type NoticeTone } from './notice.component';
import { PageLayout } from './page-layout.component';
import { Tag } from './tag.component';

// Kept for modules/legal/legal.const.ts (user-owned), which still imports the type from this file.
export type { DocumentContent } from './document-content.interface';

/** Content block of a long-form section: data in `<module>.const.ts`, rendered the same way on every document. */
export type DocBlock =
  | { kind: 'p'; text: ReactNode }
  | { kind: 'list'; items: readonly ReactNode[]; ordered?: boolean }
  | { kind: 'table'; caption: string; headers: readonly string[]; rows: readonly (readonly ReactNode[])[] }
  | { kind: 'defs'; items: readonly { term: ReactNode; text: ReactNode }[] }
  | { kind: 'notice'; text: ReactNode; tone?: NoticeTone };

interface DocumentPageLayoutProps extends DocumentContent {
  breadcrumb?: readonly BreadcrumbItem[];
  /** Version and effective date (YYYY-MM-DD) shown as badges under the title. */
  version?: string;
  effectiveAt?: IsoDate | string;
  /** Date of the last review when the document has no version (e.g. accessibility audit). */
  updatedAt?: IsoDate | string;
  /** Banner above the sections (e.g. "draft pending legal review"). */
  notice?: ReactNode;
  noticeTone?: NoticeTone;
}

export function DocBlocks({ blocks }: { blocks: readonly DocBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.kind) {
          case 'p':
            return <p key={i}>{block.text}</p>;
          case 'list': {
            const List = block.ordered ? 'ol' : 'ul';
            return (
              <List key={i} className="doc-list">
                {block.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </List>
            );
          }
          case 'table':
            return (
              <div key={i} className="table-wrap">
                <table className="table">
                  <caption className="sr-only">{block.caption}</caption>
                  <thead>
                    <tr>
                      {block.headers.map((h) => (
                        <th key={h} scope="col">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) =>
                          c === 0 ? (
                            <th key={c} scope="row">
                              {cell}
                            </th>
                          ) : (
                            <td key={c}>{cell}</td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'defs':
            return (
              <dl key={i} className="doc-defs">
                {block.items.map((item, j) => (
                  <div key={j}>
                    <dt>{item.term}</dt>
                    <dd>{item.text}</dd>
                  </div>
                ))}
              </dl>
            );
          case 'notice':
            return (
              <Notice key={i} tone={block.tone ?? 'info'}>
                {block.text}
              </Notice>
            );
        }
      })}
    </>
  );
}

function DocSectionCard({ section, index }: { section: DocSection; index: number }) {
  const headingId = useId();
  return (
    <section id={section.id} className="doc-section" aria-labelledby={headingId}>
      <h2 id={headingId}>
        <span className="doc-num" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        {section.title}
      </h2>
      {section.blocks && <DocBlocks blocks={section.blocks} />}
      {section.children}
    </section>
  );
}

/**
 * ONE layout for every long-form page (privacy, terms, cookies, accessibility, criteria): header with version and
 * dates, optional notice, numbered sections and a sticky table of contents (first on phones).
 */
export function DocumentPageLayout({
  title,
  eyebrow,
  lead,
  sections,
  breadcrumb = [{ label: title }],
  version,
  effectiveAt,
  updatedAt,
  notice,
  noticeTone = 'warning',
}: DocumentPageLayoutProps) {
  const docText = useText(DOCUMENT_PAGE_MESSAGES);
  const tocId = useId();
  const meta = [
    version && docText.version(version),
    effectiveAt && docText.effectiveSince(formatDate(effectiveAt)),
    updatedAt && docText.updatedAt(formatDate(updatedAt)),
  ].filter((m): m is string => Boolean(m));
  return (
    <PageLayout
      title={title}
      eyebrow={eyebrow}
      lead={lead}
      breadcrumb={breadcrumb}
      badges={
        meta.length > 0 && (
          <div className="doc-meta">
            {meta.map((m) => (
              <Tag key={m} tone="soft">
                {m}
              </Tag>
            ))}
          </div>
        )
      }
    >
      <div className="doc-layout">
        <nav className="doc-toc" aria-labelledby={tocId}>
          <span id={tocId} className="label">
            {docText.toc}
          </span>
          <ol>
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.title}</a>
              </li>
            ))}
          </ol>
        </nav>
        <article className="doc-article">
          {notice && <Notice tone={noticeTone}>{notice}</Notice>}
          {sections.map((s, i) => (
            <DocSectionCard key={s.id} section={s} index={i} />
          ))}
        </article>
      </div>
    </PageLayout>
  );
}
