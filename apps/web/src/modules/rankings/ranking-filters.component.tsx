import {
  DEFAULT_RANKING_SORT,
  RANKING_SORT_VALUES,
  type RankingDetailSearch,
  RankingFilterKey,
  type RankingFilterOptionsResponse,
  RankingSort,
} from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Select } from '@/shared-ui/select.component';

import { RANKINGS_MESSAGES } from './rankings.const';

/** Filters whose values are codes the page translates (the others carry the data label: country, competition…). */
const TRANSLATED_KEYS: ReadonlySet<RankingFilterKey> = new Set([
  RankingFilterKey.Sex,
  RankingFilterKey.Gi,
  RankingFilterKey.Belt,
  RankingFilterKey.Absolute,
  RankingFilterKey.Gender,
  RankingFilterKey.Season,
]);

interface RankingFiltersProps {
  /** Filters of the snapshot's methodology with the values present in it (GET /api/rankings/:id/filters). */
  filters: RankingFilterOptionsResponse['filters'];
  search: RankingDetailSearch;
  /** Raw select value of one filter ('' clears it). */
  onFilter: (key: RankingFilterKey, raw: string) => void;
  onSort: (sort: RankingSort | undefined) => void;
  onReset: () => void;
  activeCount: number;
  resultCount: number | undefined;
}

/** Filters of one ranking (T2.5), synced to the URL: one native select per filter of the methodology, plus the sort. */
export function RankingFilters({ filters, search, onFilter, onSort, onReset, activeCount, resultCount }: RankingFiltersProps) {
  const t = useText(RANKINGS_MESSAGES).filters;
  const sortOptions = RANKING_SORT_VALUES.map((value) => ({ value, label: value === RankingSort.Name ? t.sortName : t.sortRank }));
  return (
    <FilterBar label={t.label} activeCount={activeCount} onReset={onReset} {...(resultCount === undefined ? {} : { resultCount })}>
      {filters.map(({ key, options }) => {
        const current = search[key] === undefined ? '' : String(search[key]);
        // A value from the URL that this snapshot does not list stays selectable, so the control shows the real state.
        const all = current && !options.some((o) => o.value === current) ? [...options, { value: current, label: current }] : options;
        if (all.length === 0) return null;
        return (
          <FormField key={key} label={t.keys[key] ?? key}>
            {(p) => (
              <Select
                {...p}
                name={key}
                options={all.map((o) => ({ value: o.value, label: (TRANSLATED_KEYS.has(key) ? t.values[o.value] : undefined) ?? o.label }))}
                placeholder={t.all}
                value={current}
                onChange={(e) => onFilter(key, e.target.value)}
              />
            )}
          </FormField>
        );
      })}
      <FormField label={t.sort}>
        {(p) => (
          <Select
            {...p}
            name="sort"
            options={sortOptions}
            value={search.sort ?? DEFAULT_RANKING_SORT}
            onChange={(e) => onSort(RANKING_SORT_VALUES.find((v) => v === e.target.value && v !== DEFAULT_RANKING_SORT))}
          />
        )}
      </FormField>
    </FilterBar>
  );
}
