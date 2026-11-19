import './sports.page.css';

import { type CompetitionEvent, matchesAthleteFilters, matchesCompetitionFilters, nextMonthDayOccurrence, type ObservanceEvent, CalendarEventType, normalizeForSearch, type SportPage as SportPageData, SportPageFiltersSchema } from '@was/shared';
import { getRouteApi, Link } from '@tanstack/react-router';

import { useToday } from '@/app/use-boot.hook';
import { sportPageQuery } from '@/data/endpoints/sports.query';
import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { EventList } from '@/shared-ui/event-list.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { Skeleton, SkeletonList } from '@/shared-ui/skeleton.component';
import { SportDot } from '@/shared-ui/sport-dot.component';
import { Tag } from '@/shared-ui/tag.component';
import { useHashScroll } from '@/shared-ui/use-hash-scroll.hook';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { SportAssociations } from './sport-associations.component';
import { SportChampions } from './sport-champions.component';
import { SportCompetitions } from './sport-competitions.component';
import { SportFilters } from './sport-filters.component';
import { SportGovernance } from './sport-governance.component';
import { sportPageInput } from './sports-query.helper';
import { SPORTS_MESSAGES } from './sports.const';

const route = getRouteApi('/sports/$slug');

const loadingSkeleton = (
  <div className="page">
    <Skeleton className="mt-6 h-4 w-48" />
    <Skeleton className="mt-4 h-12 w-72" />
    <Skeleton className="mt-4 h-16 w-full" />
    <div className="page-body-aside mt-6">
      <SkeletonList rows={4} className="h-24 w-full" />
      <SkeletonList rows={3} className="h-32 w-full" />
    </div>
  </div>
);

function ExternalButton({ href, children }: { href: string; children: string }) {
  const t = useText(SPORTS_MESSAGES).page;
  return (
    <a className="btn btn-secondary btn-sm" href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> {t.external}</span>
    </a>
  );
}

function SportContent({ sport }: { sport: SportPageData }) {
  const t = useText(SPORTS_MESSAGES).page;
  const programme = useText(SPORTS_MESSAGES).programme;
  const { filters, setFilter, reset, activeCount } = useUrlFilters(SportPageFiltersSchema);
  useHashScroll();
  const q = normalizeForSearch(filters.q);
  const athletes = sport.athletes.filter((a) =>
    matchesAthleteFilters(a, {
      q: filters.q,
      country: filters.country,
      tier: filters.tier,
    }),
  );
  const competitions = sport.competitions.filter((c) => matchesCompetitionFilters(c, filters));
  const categories = sport.categories.filter((c) => !q || normalizeForSearch([c.name, ...c.children].join(' ')).includes(q));
  const today = useToday();
  const observances: ObservanceEvent[] = sport.observances
    .map((o) => ({
      ...o,
      type: CalendarEventType.Observance,
      date: nextMonthDayOccurrence(o.md, today),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const upcoming: CompetitionEvent[] = sport.upcoming;

  return (
    <PageLayout
      title={sport.name}
      contentLocale={sport.contentLocale}
      heading={sport.name}
      eyebrow={
        <>
          <SportDot colorToken={sport.colorToken} />
          {sport.group} › {sport.subgroup} · {sport.isTeamSport ? t.team : t.individual}
        </>
      }
      lead={sport.description}
      breadcrumb={[{ label: t.sports, link: { to: '/sports' } }, { label: `${sport.group} › ${sport.subgroup}` }, { label: sport.name }]}
      actions={
        <>
          {sport.wikipedia && <ExternalButton href={sport.wikipedia}>{t.wikipedia}</ExternalButton>}
          {sport.wikidataQid && <ExternalButton href={`https://www.wikidata.org/wiki/${sport.wikidataQid}`}>{t.wikidata(sport.wikidataQid)}</ExternalButton>}
        </>
      }
    >
      <SportFilters
        sport={sport}
        filters={filters}
        setFilter={setFilter}
        reset={reset}
        activeCount={activeCount}
        summary={activeCount > 0 ? t.resultSummary(athletes.length, sport.athletes.length, competitions.length, sport.competitions.length) : undefined}
      />
      <div className="grid">
        <div className="c-8 stack">
          <Section
            title={t.champions}
            actions={
              sport.athletes.length > 0 && (
                <ButtonLink variant="link" to="/athletes" search={{ sport: sport.slug }}>
                  {t.seeAllChampions}
                </ButtonLink>
              )
            }
          >
            <SportChampions athletes={athletes} totalAthletes={sport.athletes.length} report={sport.collectionReport} />
          </Section>
          <Section title={t.competitions} eyebrow={t.competitionsEyebrow}>
            <SportCompetitions competitions={competitions} />
          </Section>
          <Section title={t.rules}>
            <p className="max-w-[68ch]">{sport.rules ?? t.noRules}</p>
          </Section>
          {sport.sections.map((section) => (
            <Section key={section.key} title={section.title}>
              <p className="max-w-[68ch]">{section.body}</p>
              {section.sources.length > 0 && (
                <p className="muted mt-2 text-sm">
                  {programme.sources}{' '}
                  {section.sources.map((url, i) => (
                    <span key={url}>
                      {i > 0 && ' · '}
                      <a href={url} target="_blank" rel="noreferrer">
                        {new URL(url).hostname.replace(/^www\./, '')}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </Section>
          ))}
        </div>
        <aside className="c-4 stack">
          {(sport.partOf || sport.disciplines.length > 0) && (
            <Section title={sport.partOf ? programme.partOfTitle : programme.disciplinesTitle}>
              {sport.partOf && (
                <p>
                  <Link to="/sports/$slug" params={{ slug: sport.partOf.slug }}>
                    <SportDot colorToken={sport.partOf.colorToken} /> {sport.partOf.name}
                  </Link>
                </p>
              )}
              {sport.disciplines.length > 0 && (
                <>
                  {sport.partOf && <h3 className="label mt-3">{programme.disciplinesTitle}</h3>}
                  <ul className="row mt-1.5 gap-1.5">
                    {sport.disciplines.map((d) => (
                      <li key={d.slug}>
                        <Link to="/sports/$slug" params={{ slug: d.slug }}>
                          <Tag tone="soft">{d.name}</Tag>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Section>
          )}
          <Section title={programme.sectionTitle}>
            {sport.programmes.length > 0 ? (
              <ul className="stack gap-1.5">
                {sport.programmes.map((p) => (
                  <li key={`${p.slug}-${p.status}`}>
                    <b className="font-semibold">{p.name}</b> · {programme.status[p.status] ?? p.status}
                    {p.years.length > 0 && <span className="muted"> ({p.years.join(', ')})</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">{programme.none}</p>
            )}
          </Section>
          <Section title={t.categories}>
            {categories.length > 0 ? (
              <ul className="cat-tree">
                {categories.map((c) => (
                  <li key={c.name}>
                    <b className="font-semibold">{c.name}</b>
                    {c.children.length > 0 && (
                      <div className="row mt-1.5 gap-1.5">
                        {c.children.map((x) => (
                          <Tag key={x} tone="soft">
                            {x}
                          </Tag>
                        ))}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty">{t.noCategories}</p>
            )}
          </Section>
          <Section title={t.upcoming}>
            <EventList events={upcoming} emptyTitle={t.noUpcoming} withBadges />
          </Section>
          <Section title={t.observances}>
            <EventList events={observances} emptyTitle={t.noObservances} withBadges />
          </Section>
        </aside>
      </div>
      <SportGovernance sport={sport} />
      <SportAssociations sport={sport} />
    </PageLayout>
  );
}

/**
 * P7 Sport page (doc 09). Order (04/11/2026): header · search + filters (URL) · champions (or collection report),
 * competitions by level, rules + aside (categories, upcoming, sport days) · LAST: who rules / pinnacle / environment
 * and "Associações de X" (#associacoes).
 */
export function SportPage() {
  const t = useText(SPORTS_MESSAGES).page;
  const { slug } = route.useParams();
  const sport = sportPageQuery.useQuery(sportPageInput(slug));
  return (
    <QueryBoundary
      query={sport}
      loading={loadingSkeleton}
      notFound={
        <div className="page">
          <EmptyState title={t.notFoundTitle} mark="?" action={<ButtonLink to="/sports">{t.backToSports}</ButtonLink>}>
            {t.notFoundText}
          </EmptyState>
        </div>
      }
    >
      {(s) => <SportContent sport={s} />}
    </QueryBoundary>
  );
}
