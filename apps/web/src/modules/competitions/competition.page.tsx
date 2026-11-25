import { getRouteApi } from '@tanstack/react-router';
import type { CompetitionEditionSummary, CompetitionPage as CompetitionPageData } from '@was/shared';

import { competitionPageQuery } from '@/data/endpoints/competitions.query';
import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { formatDateRange } from '@/shared-ui/format.helper';
import { LevelTag } from '@/shared-ui/level-tag.component';
import { NewTabNote } from '@/shared-ui/new-tab-note.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tag } from '@/shared-ui/tag.component';

import { competitionBreadcrumb } from './competition-breadcrumb.helper';
import { CompetitionSources } from './competition-sources.component';
import { COMPETITIONS_MESSAGES } from './competitions.const';
import { competitionPageInput } from './competitions-query.helper';
import { CompetitorName } from './competitor-name.component';

const route = getRouteApi('/competitions/$competition');

function EditionsTable({ competition }: { competition: CompetitionPageData }) {
  const t = useText(COMPETITIONS_MESSAGES);
  return (
    <DataTable<CompetitionEditionSummary>
      caption={t.editionsCaption(competition.name)}
      captionHidden
      rows={competition.editions}
      rowKey={(e) => e.key}
      columns={[
        {
          key: 'edition',
          header: t.edition,
          sortValue: (e) => e.year ?? e.number,
          cell: (e) => (
            <ButtonLink variant="link" to="/competitions/$competition/$edition" params={{ competition: competition.slug, edition: e.key }}>
              {e.label ?? e.year?.toString() ?? e.key}
            </ButtonLink>
          ),
        },
        {
          key: 'dates',
          header: t.dates,
          cell: (e) => (e.startDate && e.endDate ? formatDateRange(e.startDate, e.endDate) : (e.year?.toString() ?? '—')),
        },
        { key: 'host', header: t.host, cell: (e) => (e.host ? <CompetitorName name={e.host.name} slug={null} nation={e.host} /> : '—') },
        {
          key: 'winners',
          header: t.winners,
          cell: (e) =>
            e.winners.length ? (
              <ul className="stack">
                {e.winners.map((w) => (
                  <li key={`${w.kind}:${w.slug ?? w.name}`}>
                    <CompetitorName {...w} />
                  </li>
                ))}
              </ul>
            ) : e.status === 'finished' ? (
              '—'
            ) : (
              t.status[e.status]
            ),
        },
      ]}
    />
  );
}

/** T4.1 competition page: facts, editions with their champions, sources (SSR, JSON-LD EventSeries from the route). */
export function CompetitionPage() {
  const t = useText(COMPETITIONS_MESSAGES);
  const { competition } = route.useParams();
  const query = competitionPageQuery.useQuery(competitionPageInput(competition));
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
      {(c) => (
        <PageLayout
          title={c.name}
          eyebrow={t.eyebrow}
          breadcrumb={competitionBreadcrumb(t.sports, c, true)}
          contentLocale={c.contentLocale}
          badges={
            <>
              {c.level && <LevelTag level={c.level} />}
              {c.isOlympic && <Tag tone="soft">{t.olympic}</Tag>}
              {c.isMultiSport && <Tag tone="soft">{t.multiSport}</Tag>}
            </>
          }
        >
          <Section title={t.facts}>
            <FactList
              variant="split"
              items={[
                ...(c.sport ? [{ key: 'sport', term: t.sport, detail: c.sport.name }] : []),
                ...(c.organization ? [{ key: 'org', term: t.organizer, detail: c.organization.name }] : []),
                { key: 'editions', term: t.editionsCount, detail: String(c.editions.length) },
                ...(c.wikidataQid
                  ? [
                      {
                        key: 'qid',
                        term: t.wikidata,
                        detail: (
                          <a href={`https://www.wikidata.org/wiki/${c.wikidataQid}`} target="_blank" rel="noopener noreferrer">
                            {c.wikidataQid}
                            <NewTabNote />
                          </a>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </Section>
          <Section title={t.editions} id="editions">
            {c.editions.length ? <EditionsTable competition={c} /> : <EmptyState title={t.noEditionsTitle}>{t.noEditionsText}</EmptyState>}
          </Section>
          <CompetitionSources sources={c.sources} />
        </PageLayout>
      )}
    </QueryBoundary>
  );
}
