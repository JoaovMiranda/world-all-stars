import { AthleteListQuerySchema, pageCountOf, TIER_ORDER } from '@was/shared';
import { useEffect, useMemo, useRef } from 'react';

import { athletesQuery } from '@/data/endpoints/athletes.query';
import { currentFormat } from '@/i18n/use-format.hook';
import { useText } from '@/i18n/use-text.hook';
import { AthleteGrid } from '@/shared-ui/athlete-grid.component';
import { Button } from '@/shared-ui/button.component';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { Pagination } from '@/shared-ui/pagination.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SearchInput } from '@/shared-ui/search-input.component';
import { Select } from '@/shared-ui/select.component';
import type { SelectOption } from '@/shared-ui/select-option.interface';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';
import { useUrlSearchText } from '@/shared-ui/use-url-search-text.hook';
import { ATHLETES_MESSAGES } from './athletes.const';
import { ALL_ATHLETES_INPUT } from './athletes-query.const';
import { athletesListInput } from './athletes-query.helper';

const byLabel = (a: SelectOption, b: SelectOption) => currentFormat().compare(a.label, b.label);

/** Hick: how many countries to lift to the top of the country select (by number of athletes). */
const FREQUENT_COUNTRIES = 5;

/** Countries with the most athletes (at least 2, ties by name), shown first so the usual picks need no scanning. */
function frequentCountries(items: readonly { nationalities: readonly { iso2: string; flag: string; name: string }[] }[]): SelectOption[] {
  const counts = new Map<string, { option: SelectOption; n: number }>();
  for (const a of items)
    for (const c of a.nationalities) {
      const entry = counts.get(c.iso2) ?? { option: { value: c.iso2, label: `${c.flag} ${c.name}` }, n: 0 };
      entry.n += 1;
      counts.set(c.iso2, entry);
    }
  return [...counts.values()]
    .filter((e) => e.n >= 2)
    .sort((a, b) => b.n - a.n || byLabel(a.option, b.option))
    .slice(0, FREQUENT_COUNTRIES)
    .map((e) => e.option);
}

/** P4 Athletes list (doc 09): name/nickname search + sport, country and tier filters bound to the URL. */
export function AthletesPage() {
  const t = useText(ATHLETES_MESSAGES).list;
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const TIER_OPTIONS: SelectOption[] = TIER_ORDER.map((v) => ({ value: v, label: labels.tier[v] }));
  const ui = useText(UI_MESSAGES);
  const { filters, setFilters, reset } = useUrlFilters(AthleteListQuerySchema);
  const { page = 1, ...criteria } = filters;
  const activeCount = Object.values(criteria).filter((v) => v !== undefined).length;
  // Any filter change goes back to the first page (page 3 of another filter is meaningless).
  const setFilter = <K extends keyof typeof criteria>(key: K, value: (typeof criteria)[K] | undefined) =>
    setFilters({ [key]: value, page: undefined } as Partial<typeof filters>);
  // After a page change, focus moves to the new results (the clicked page button may no longer exist: WCAG 2.4.3).
  const focusResults = useRef(false);
  const goToPage = (p: number) => {
    setFilters({ page: p === 1 ? undefined : p });
    focusResults.current = true;
    document.getElementById('athletes-results')?.scrollIntoView({ block: 'start' });
  };
  const [q, setQ] = useUrlSearchText(filters.q, (v) => setFilter('q', v));
  const all = athletesQuery.useQuery(ALL_ATHLETES_INPUT);
  const list = athletesQuery.useQuery(athletesListInput(filters));
  useEffect(() => {
    if (!focusResults.current || !list.data || list.isFetching) return;
    focusResults.current = false;
    document.getElementById('athletes-results')?.focus({ preventScroll: true });
  }, [list.data, list.isFetching]);

  const options = useMemo(() => {
    const items = all.data?.items ?? [];
    return {
      sports: [...new Map(items.map((a) => [a.sport.slug, { value: a.sport.slug, label: a.sport.name }])).values()].sort(byLabel),
      countries: [...new Map(items.flatMap((a) => a.nationalities.map((n) => [n.iso2, { value: n.iso2, label: `${n.flag} ${n.name}` }]))).values()].sort(
        byLabel,
      ),
      frequentCountries: frequentCountries(items),
    };
  }, [all.data]);

  const total = all.data?.total ?? 0;
  const hasData = total > 0;

  return (
    <PageLayout title={t.title} eyebrow={t.eyebrow} lead={t.lead}>
      {(hasData || activeCount > 0) && (
        <FilterBar label={t.filtersLabel} activeCount={activeCount} onReset={reset}>
          <FormField label={t.searchField}>
            {(p) => <SearchInput {...p} inline placeholder={t.searchPlaceholder} value={q} onChange={(e) => setQ(e.target.value)} />}
          </FormField>
          <FormField label={t.sport}>
            {(p) => (
              <Select
                {...p}
                options={options.sports}
                placeholder={t.allSports}
                value={filters.sport ?? ''}
                onChange={(e) => setFilter('sport', e.target.value || undefined)}
              />
            )}
          </FormField>
          <FormField label={t.country}>
            {(p) => (
              <Select
                {...p}
                placeholder={t.allCountries}
                value={filters.country?.toUpperCase() ?? ''}
                onChange={(e) => setFilter('country', e.target.value || undefined)}
              >
                {options.frequentCountries.length > 0 ? (
                  <>
                    <optgroup label={t.countriesFrequent}>
                      {options.frequentCountries.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label={t.countriesAll}>
                      {options.countries.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  options.countries.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))
                )}
              </Select>
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
          {/* Always mounted: a live region inserted together with its text is often not announced (WCAG 4.1.3). */}
          <span className="muted self-center text-[13px]" aria-live="polite">
            {list.data && all.data ? t.count(list.data.total, total) : ''}
          </span>
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
          <div id="athletes-results" tabIndex={-1} aria-label={t.resultsLabel}>
            <AthleteGrid
              athletes={data.items}
              emptyTitle={t.noResultsTitle}
              emptyText={t.noResultsText}
              emptyAction={
                <Button variant="secondary" onClick={reset}>
                  {ui.clearFilters}
                </Button>
              }
            />
            <Pagination page={page} pageCount={pageCountOf(data.total)} onChange={goToPage} />
          </div>
        )}
      </QueryBoundary>
    </PageLayout>
  );
}
