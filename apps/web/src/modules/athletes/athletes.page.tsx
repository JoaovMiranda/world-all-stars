import { AthleteFiltersSchema, TIER_ORDER } from '@was/shared';
import { useMemo } from 'react';

import { athletesQuery } from '@/data/endpoints/athletes.query';
import { AthleteGrid } from '@/shared-ui/athlete-grid.component';
import { Button } from '@/shared-ui/button.component';
import { TIER_LABEL } from '@/shared-ui/domain-labels.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SearchInput } from '@/shared-ui/search-input.component';
import { Select, type SelectOption } from '@/shared-ui/select.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { UI_TEXT } from '@/shared-ui/ui-text.const';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';
import { useUrlSearchText } from '@/shared-ui/use-url-search-text.hook';

import { ALL_ATHLETES_INPUT, athletesListInput } from './athletes-query.helper';
import { ATHLETES_TEXT } from './athletes.const';

const t = ATHLETES_TEXT.list;
const byLabel = (a: SelectOption, b: SelectOption) => a.label.localeCompare(b.label, 'pt-BR');
const TIER_OPTIONS: SelectOption[] = TIER_ORDER.map((v) => ({ value: v, label: TIER_LABEL[v] }));

/** P4 Athletes list (doc 09): name/nickname search + sport, country and tier filters bound to the URL. */
export function AthletesPage() {
  const { filters, setFilter, reset, activeCount } = useUrlFilters(AthleteFiltersSchema);
  const [q, setQ] = useUrlSearchText(filters.q, (v) => setFilter('q', v));
  const all = athletesQuery.useQuery(ALL_ATHLETES_INPUT);
  const list = athletesQuery.useQuery(athletesListInput(filters));

  const options = useMemo(() => {
    const items = all.data?.items ?? [];
    return {
      sports: [...new Map(items.map((a) => [a.sport.slug, { value: a.sport.slug, label: a.sport.name }])).values()].sort(byLabel),
      countries: [...new Map(items.flatMap((a) => a.nationalities.map((n) => [n.iso2, { value: n.iso2, label: `${n.flag} ${n.name}` }]))).values()].sort(byLabel),
    };
  }, [all.data]);

  const total = all.data?.total ?? 0;
  const hasData = total > 0;

  return (
    <PageLayout title={t.title} eyebrow={t.eyebrow} lead={t.lead}>
      {(hasData || activeCount > 0) && (
        <FilterBar label={t.filtersLabel} activeCount={activeCount} onReset={reset}>
          <FormField label={t.searchField}>
            {(p) => <SearchInput {...p} inline label={t.searchLabel} placeholder={t.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />}
          </FormField>
          <FormField label={t.sport}>
            {(p) => <Select {...p} options={options.sports} placeholder={t.allSports} value={filters.sport ?? ''} onChange={(e) => setFilter('sport', e.target.value || undefined)} />}
          </FormField>
          <FormField label={t.country}>
            {(p) => (
              <Select {...p} options={options.countries} placeholder={t.allCountries} value={filters.country?.toUpperCase() ?? ''} onChange={(e) => setFilter('country', e.target.value || undefined)} />
            )}
          </FormField>
          <FormField label={t.tier}>
            {(p) => (
              <Select
                {...p}
                options={TIER_OPTIONS}
                placeholder={t.allTiers}
                value={filters.tier ?? ''}
                onChange={(e) => setFilter('tier', (e.target.value || undefined) as typeof filters.tier)}
              />
            )}
          </FormField>
          {list.data && all.data && (
            <span className="muted self-center text-[13px]" aria-live="polite">
              {t.count(list.data.total, total)}
            </span>
          )}
        </FilterBar>
      )}
      <QueryBoundary
        query={list}
        errorTitle={t.errorTitle}
        loading={<SkeletonList rows={6} className="h-20 w-full" />}
        isEmpty={(d) => d.total === 0 && activeCount === 0}
        empty={
          <EmptyState title={t.emptyTitle} mark="◇">
            {t.emptyText}
          </EmptyState>
        }
      >
        {(data) => (
          <AthleteGrid
            athletes={data.items}
            emptyTitle={t.noResultsTitle}
            emptyText={t.noResultsText}
            emptyAction={
              <Button variant="secondary" onClick={reset}>
                {UI_TEXT.clearFilters}
              </Button>
            }
          />
        )}
      </QueryBoundary>
    </PageLayout>
  );
}
