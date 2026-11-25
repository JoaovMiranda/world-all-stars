import { Link } from '@tanstack/react-router';
import { type IsoDate, RANKING_SEX_VALUES, RankingsListQuerySchema } from '@was/shared';

import { rankingMethodologiesQuery, rankingsQuery } from '@/data/endpoints/rankings.query';
import { useText } from '@/i18n/use-text.hook';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { formatDate } from '@/shared-ui/format.helper';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { Select } from '@/shared-ui/select.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { MethodologyLinks } from './methodology-links.component';
import { RANKINGS_MESSAGES } from './rankings.const';
import { rankingsListInput } from './rankings-query.helper';

/** Rankings (handoff v3 §8): published snapshots grouped by methodology; filters in the URL (T2.5). */
export function RankingsPage() {
  const messages = useText(RANKINGS_MESSAGES);
  const t = messages.list;
  const { filters, setFilter, reset, activeCount } = useUrlFilters(RankingsListQuerySchema);
  const query = rankingsQuery.useQuery(rankingsListInput(filters));
  const methodologies = rankingMethodologiesQuery.useQuery();
  const methodologyOptions = (methodologies.data?.items ?? []).map((m) => ({ value: m.key, label: t.methodologies[m.key] ?? m.key }));
  // A methodology from the URL that is not registered stays selectable, so the control shows the real state.
  if (filters.methodology && !methodologyOptions.some((o) => o.value === filters.methodology))
    methodologyOptions.push({ value: filters.methodology, label: t.methodologies[filters.methodology] ?? filters.methodology });
  const genderOptions = RANKING_SEX_VALUES.map((value) => ({ value, label: messages.filters.values[value] ?? value }));
  return (
    <PageLayout title={t.title} eyebrow={t.eyebrow} lead={t.lead} breadcrumb={[{ label: t.title }]}>
      <FilterBar label={t.filtersLabel} activeCount={activeCount} onReset={reset} {...(activeCount > 0 && query.data ? { resultCount: query.data.items.length } : {})}>
        <FormField label={t.methodology}>
          {(p) => (
            <Select
              {...p}
              name="methodology"
              options={methodologyOptions}
              placeholder={t.allMethodologies}
              value={filters.methodology ?? ''}
              onChange={(e) => setFilter('methodology', e.target.value || undefined)}
            />
          )}
        </FormField>
        <FormField label={t.gender}>
          {(p) => (
            <Select
              {...p}
              name="gender"
              options={genderOptions}
              placeholder={t.allGenders}
              value={filters.gender ?? ''}
              onChange={(e) =>
                setFilter(
                  'gender',
                  RANKING_SEX_VALUES.find((v) => v === e.target.value),
                )
              }
            />
          )}
        </FormField>
      </FilterBar>
      <QueryBoundary
        query={query}
        loading={<SkeletonList rows={4} />}
        isEmpty={(d) => d.items.length === 0}
        empty={
          activeCount > 0 ? <EmptyState title={t.noResultsTitle}>{t.noResultsText}</EmptyState> : <EmptyState title={t.emptyTitle}>{t.emptyText}</EmptyState>
        }
      >
        {(data) => {
          const groups = [...new Set(data.items.map((i) => i.methodology))];
          return groups.map((methodology) => (
            <Section key={methodology} title={t.methodologies[methodology] ?? methodology} eyebrow={t.methodology}>
              <ul className="stack gap-2">
                {data.items
                  .filter((i) => i.methodology === methodology)
                  .map((i) => (
                    <li key={i.id}>
                      <Link to="/rankings/$id" params={{ id: i.id }}>
                        <b className="font-semibold">{i.title}</b>
                      </Link>{' '}
                      <span className="muted">
                        · {t.entries(i.entries)}
                        {i.publishedAt && ` · ${t.published(formatDate(i.publishedAt.slice(0, 10) as IsoDate))}`}
                      </span>
                    </li>
                  ))}
              </ul>
            </Section>
          ));
        }}
      </QueryBoundary>
      <MethodologyLinks />
    </PageLayout>
  );
}
