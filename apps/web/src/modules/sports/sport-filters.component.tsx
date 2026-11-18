import { COMPETITION_LEVEL_VALUES, type SportPage, type SportPageFilters, TIER_VALUES } from '@was/shared';
import { useMemo } from 'react';

import { useFormat } from '@/i18n/use-format.hook';
import { useText } from '@/i18n/use-text.hook';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { SearchInput } from '@/shared-ui/search-input.component';
import { Select } from '@/shared-ui/select.component';

import { SPORTS_MESSAGES } from './sports.const';

interface SportFiltersProps {
  sport: SportPage;
  filters: SportPageFilters;
  setFilter: <K extends keyof SportPageFilters>(key: K, value: SportPageFilters[K] | undefined) => void;
  reset: () => void;
  activeCount: number;
  /** "x de y campeões · a de b competições" (only when filtering). */
  summary: string | undefined;
}

/** Search + country / athlete tier / competition level, synced to the URL (SportPageFiltersSchema). */
export function SportFilters({ sport, filters, setFilter, reset, activeCount, summary }: SportFiltersProps) {
  const t = useText(SPORTS_MESSAGES).page;
  const fmt = useFormat();
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const TIER_OPTIONS = TIER_VALUES.map((value) => ({ value, label: labels.tier[value] }));
  const countries = useMemo(
    () =>
      [...new Map(sport.athletes.flatMap((a) => a.nationalities.map((n) => [n.iso2, `${n.flag} ${n.name}`] as const))).entries()]
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => fmt.compare(a.label, b.label)),
    [sport.athletes, fmt],
  );
  const levels = COMPETITION_LEVEL_VALUES.filter((l) => sport.competitions.some((c) => c.level === l)).map((value) => ({ value, label: labels.level[value] }));

  return (
    <FilterBar label={t.filtersLabel} activeCount={activeCount} onReset={reset}>
      <form role="search" className="sports-search" onSubmit={(e) => e.preventDefault()}>
        <SearchInput inline label={t.searchLabel} placeholder={t.searchPlaceholder} value={filters.q ?? ''} onChange={(e) => setFilter('q', e.target.value)} />
      </form>
      <FormField label={t.country}>
        {(p) => (
          <Select
            {...p}
            options={countries}
            placeholder={t.allCountries}
            value={filters.country ?? ''}
            onChange={(e) => setFilter('country', e.target.value || undefined)}
          />
        )}
      </FormField>
      <FormField label={t.tier}>
        {(p) => (
          <Select
            {...p}
            options={TIER_OPTIONS}
            placeholder={t.allTiers}
            value={filters.tier ?? ''}
            onChange={(e) =>
              setFilter(
                'tier',
                TIER_VALUES.find((v) => v === e.target.value),
              )
            }
          />
        )}
      </FormField>
      <FormField label={t.level}>
        {(p) => (
          <Select
            {...p}
            options={levels}
            placeholder={t.allLevels}
            value={filters.level ?? ''}
            onChange={(e) =>
              setFilter(
                'level',
                COMPETITION_LEVEL_VALUES.find((v) => v === e.target.value),
              )
            }
          />
        )}
      </FormField>
      {summary && (
        <p className="muted w-full text-sm" aria-live="polite">
          {summary}
        </p>
      )}
    </FilterBar>
  );
}
