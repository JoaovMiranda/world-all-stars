import { getRouteApi } from '@tanstack/react-router';
import type { EditionRef } from '@was/shared';

import { editionPageQuery } from '@/data/endpoints/competitions.query';
import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { formatDate, formatDateRange } from '@/shared-ui/format.helper';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { competitionBreadcrumb } from './competition-breadcrumb.helper';
import { CompetitionSources } from './competition-sources.component';
import { COMPETITIONS_MESSAGES } from './competitions.const';
import { editionPageInput } from './competitions-query.helper';
import { CompetitorName } from './competitor-name.component';
import { EditionEventSection } from './edition-event.component';
import { MedalTable } from './medal-table.component';

const route = getRouteApi('/competitions/$competition/$edition');
const refLabel = (e: EditionRef) => e.label ?? e.year?.toString() ?? e.key;

/** T4.1 edition page: facts, results, final lineups, squads, medal table and sources; empty blocks are hidden. */
export function CompetitionEditionPage() {
  const t = useText(COMPETITIONS_MESSAGES);
  const { competition, edition } = route.useParams();
  const query = editionPageQuery.useQuery(editionPageInput(competition, edition));
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
      {(e) => {
        const title = e.label ?? t.editionTitle(e.competition.name, e.year?.toString() ?? '');
        const events = e.events.filter((ev) => ev.results.length || ev.squads.length || ev.lineups.length);
        return (
          <PageLayout
            title={title}
            eyebrow={t.editionEyebrow}
            breadcrumb={[...competitionBreadcrumb(t.sports, e.competition, false), { label: e.year?.toString() ?? e.key }]}
            contentLocale={e.contentLocale}
            actions={
              <nav className="row" aria-label={t.editionNav}>
                {e.previous && (
                  <ButtonLink
                    size="sm"
                    to="/competitions/$competition/$edition"
                    params={{ competition: e.competition.slug, edition: e.previous.key }}
                    aria-label={t.previousLabel(refLabel(e.previous))}
                  >
                    {t.previous(refLabel(e.previous))}
                  </ButtonLink>
                )}
                <ButtonLink size="sm" variant="ghost" to="/competitions/$competition" params={{ competition: e.competition.slug }} hash="editions">
                  {t.allEditions}
                </ButtonLink>
                {e.next && (
                  <ButtonLink
                    size="sm"
                    to="/competitions/$competition/$edition"
                    params={{ competition: e.competition.slug, edition: e.next.key }}
                    aria-label={t.nextLabel(refLabel(e.next))}
                  >
                    {t.next(refLabel(e.next))}
                  </ButtonLink>
                )}
              </nav>
            }
          >
            <Section title={t.editionFacts}>
              <FactList
                variant="split"
                items={[
                  ...(e.number !== null ? [{ key: 'number', term: t.editionNumber, detail: String(e.number) }] : []),
                  ...(e.startDate && e.endDate
                    ? [{ key: 'dates', term: t.dates, detail: formatDateRange(e.startDate, e.endDate) }]
                    : e.endDate
                      ? [{ key: 'dates', term: t.dates, detail: formatDate(e.endDate) }]
                      : []),
                  ...(e.host
                    ? [
                        {
                          key: 'host',
                          term: t.host,
                          detail: (
                            <>
                              {e.hostCity ? `${e.hostCity}, ` : ''}
                              <CompetitorName name={e.host.name} slug={null} nation={e.host} />
                            </>
                          ),
                        },
                      ]
                    : []),
                  { key: 'status', term: t.result, detail: t.status[e.status] },
                ]}
              />
            </Section>
            {events.length ? (
              events.map((ev) => <EditionEventSection key={ev.id} event={ev} showTitle={events.length > 1} />)
            ) : (
              <EmptyState title={t.noResultsTitle}>{t.noResultsText}</EmptyState>
            )}
            <MedalTable rows={e.medalTable} />
            <CompetitionSources sources={e.sources} />
          </PageLayout>
        );
      }}
    </QueryBoundary>
  );
}
