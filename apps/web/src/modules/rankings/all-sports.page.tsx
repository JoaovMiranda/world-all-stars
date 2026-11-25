import './cross-sport.css';

import { Link } from '@tanstack/react-router';
import { CROSS_SPORT_ERA_VALUES, CrossSportFiltersSchema } from '@was/shared';

import { crossSportListQuery } from '@/data/endpoints/cross-sport.query';
import { useText } from '@/i18n/use-text.hook';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { formatNumber } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { Pagination } from '@/shared-ui/pagination.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { Select } from '@/shared-ui/select.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { CROSS_SPORT_MESSAGES } from './cross-sport.const';
import { CrossSportBandBadge } from './cross-sport-band-badge.component';
import { allSportsInput } from './cross-sport-query.helper';

/** Items shown inline per competitor (the profile readout lists them all). */
const INLINE_ITEMS = 3;

/** `/rankings/all-sports` (D07): competitors grouped by band S→D, filters in the URL, approximate-comparison notice. */
export function AllSportsPage() {
  const t = useText(CROSS_SPORT_MESSAGES);
  const { filters, setFilter, setFilters, reset, activeCount } = useUrlFilters(CrossSportFiltersSchema);
  // A filter change goes back to the first page.
  const choose = (key: 'sport' | 'gender' | 'era', value: string) => setFilters({ [key]: value || undefined, page: undefined });
  const query = crossSportListQuery.useQuery(allSportsInput(filters));
  const p = t.page;
  return (
    <PageLayout title={p.title} eyebrow={p.eyebrow} lead={p.lead} breadcrumb={[{ label: p.breadcrumb, link: { to: '/rankings' } }, { label: p.title }]}>
      <Notice tone="warning">
        <p>
          <b className="font-semibold">{p.disclaimerTitle}.</b> {p.disclaimer}
        </p>
        <p>
          <Link to="/rankings/all-sports/methodology">{p.methodologyLink}</Link>
        </p>
      </Notice>
      <FilterBar label={p.filtersLabel} {...(query.data ? { resultCount: query.data.total } : {})} activeCount={activeCount} onReset={reset}>
        <FormField label={p.sport}>
          {(f) => (
            <Select
              {...f}
              placeholder={p.allSports}
              options={(query.data?.sports ?? []).map((s) => ({ value: s.slug, label: s.name }))}
              value={filters.sport ?? ''}
              onChange={(e) => choose('sport', e.target.value)}
            />
          )}
        </FormField>
        <FormField label={p.gender}>
          {(f) => (
            <Select
              {...f}
              placeholder={p.allGenders}
              options={(['male', 'female'] as const).map((g) => ({ value: g, label: p.genders[g] ?? g }))}
              value={filters.gender ?? ''}
              onChange={(e) => choose('gender', e.target.value)}
            />
          )}
        </FormField>
        <FormField label={p.era}>
          {(f) => (
            <Select
              {...f}
              placeholder={p.allEras}
              options={CROSS_SPORT_ERA_VALUES.map((era) => ({ value: era, label: p.eras[era] ?? era }))}
              value={filters.era ?? ''}
              onChange={(e) => choose('era', e.target.value)}
            />
          )}
        </FormField>
      </FilterBar>
      <QueryBoundary
        query={query}
        loading={<SkeletonList rows={6} />}
        isEmpty={(d) => d.total === 0 && activeCount === 0}
        empty={<EmptyState title={p.emptyTitle}>{p.emptyText}</EmptyState>}
      >
        {(d) => (
          <>
            {d.unmappedTotal > 0 && <p className="muted">{p.unmappedNote(d.unmappedTotal)}</p>}
            {d.groups.map((g) => (
              <Section
                key={g.band}
                title={
                  <span className="band-readout-head">
                    <CrossSportBandBadge band={g.band} decorative />
                    <span>
                      {p.bandHeading(g.band)} · {t.bands.names[g.band]}
                    </span>
                  </span>
                }
                eyebrow={`${t.bands.pointsLong(formatNumber(g.points))} · ${p.bandCount(g.total)}`}
              >
                {g.entries.length === 0 ? (
                  <p className="muted">{g.total === 0 ? p.emptyBand : p.bandCount(g.total)}</p>
                ) : (
                  <ol className="stack">
                    {g.entries.map((e) => (
                      <li key={e.competitor.id} className="band-entry">
                        <CrossSportBandBadge band={e.band} size="sm" />
                        <span>
                          <Link to="/athletes/$slug" params={{ slug: e.competitor.slug }}>
                            <b className="font-semibold">{e.competitor.name}</b>
                          </Link>
                          <span className="muted"> · {e.sports.map((s) => s.name).join(', ')}</span>
                        </span>
                        <span>{t.bands.points(formatNumber(e.points))}</span>
                        <span className="band-items muted">
                          {e.items.slice(0, INLINE_ITEMS).map((i) => (
                            <span key={i.evidenceId}>
                              {i.band} · {i.label}
                              {i.year !== null && ` ${i.year}`}
                            </span>
                          ))}
                          {e.pendingReview > 0 && <span>{p.pending(e.pendingReview)}</span>}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </Section>
            ))}
            <Pagination page={d.page} pageCount={Math.ceil(d.total / d.pageSize)} onChange={(page) => setFilter('page', page)} />
            <p className="muted cross-sport-hash">
              {p.ruleset}: {d.rulesetVersion} · {p.hash}: {d.outputHash}
            </p>
          </>
        )}
      </QueryBoundary>
    </PageLayout>
  );
}
