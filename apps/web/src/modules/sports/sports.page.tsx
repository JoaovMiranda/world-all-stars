import './sports.page.css';

import { countSports, filterSportsTree, GOVERNANCE_MODEL_VALUES, type SportGroup, SportsFiltersSchema } from '@was/shared';

import { governanceModelsQuery, organizationsQuery, sportsQuery } from '@/data/endpoints/sports.query';
import { currentText } from '@/i18n/text-for.helper';
import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { ChipToggleGroup } from '@/shared-ui/chip-toggle-group.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FilterBar } from '@/shared-ui/filter-bar.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Select } from '@/shared-ui/select.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SearchInput } from '@/shared-ui/search-input.component';
import { Section } from '@/shared-ui/section.component';
import { Skeleton, SkeletonList } from '@/shared-ui/skeleton.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { GovernanceModels } from './governance-models.component';
import { OrgHierarchy } from './org-hierarchy.component';
import { SportDirectory } from './sport-directory.component';
import { SPORTS_MESSAGES } from './sports.const';

const GOVERNANCE_OPTIONS = () => {
  const sportsText = currentText(SPORTS_MESSAGES);
  return GOVERNANCE_MODEL_VALUES.map((value) => ({
    value,
    label: sportsText.governance[value],
  }));
};

const sportGridSkeleton = (
  <div className="sport-grid">
    {Array.from({ length: 6 }, (_, i) => (
      <Skeleton key={i} className="h-56 w-full rounded-(--r-lg)" />
    ))}
  </div>
);

/** Multi-sport programmes present in the tree (filter options), by name. */
const programmeOptions = (tree: readonly SportGroup[]) =>
  [...new Map(tree.flatMap((g) => g.subgroups.flatMap((s) => s.sports.flatMap((sp) => sp.programmes.map((p) => [p.slug, p.name] as const))))).entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label));

/** P6 Sports + associations (doc 09/19): search + governance filter · groups › subgroups › cards · models · hierarchy. */
export function SportsPage() {
  const t = useText(SPORTS_MESSAGES).list;
  const sportsText = useText(SPORTS_MESSAGES);
  const { filters, setFilter, setFilters } = useUrlFilters(SportsFiltersSchema);
  const sports = sportsQuery.useQuery();
  const models = governanceModelsQuery.useQuery();
  const orgs = organizationsQuery.useQuery();
  const sportFilterCount = (filters.q ? 1 : 0) + (filters.governance ? 1 : 0) + (filters.programme ? 1 : 0);

  return (
    <PageLayout title={t.title} eyebrow={t.eyebrow} lead={t.lead} breadcrumb={[{ label: t.breadcrumb }]}>
      <QueryBoundary
        query={sports}
        loading={sportGridSkeleton}
        isEmpty={(tree) => countSports(tree) === 0}
        empty={
          <EmptyState title={t.emptyTitle} action={<ButtonLink to="/contact">{t.emptyAction}</ButtonLink>}>
            {t.emptyText}
          </EmptyState>
        }
      >
        {(tree) => {
          const visible = filterSportsTree(tree, filters);
          return (
            <div>
              <FilterBar
                label={t.filtersLabel}
                resultCount={countSports(visible)}
                activeCount={sportFilterCount}
                onReset={() => setFilters({ q: undefined, governance: undefined, programme: undefined })}
              >
                <form role="search" aria-label={t.searchLabel} className="sports-search" onSubmit={(e) => e.preventDefault()}>
                  <SearchInput
                    inline
                    label={t.searchLabel}
                    placeholder={t.searchPlaceholder}
                    value={filters.q ?? ''}
                    onChange={(e) => setFilter('q', e.target.value)}
                  />
                </form>
                <div className="sports-chip-filter">
                  <span className="label" aria-hidden="true">
                    {t.governanceLabel}
                  </span>
                  <ChipToggleGroup
                    label={t.governanceLabel}
                    options={GOVERNANCE_OPTIONS()}
                    value={filters.governance}
                    onChange={(v) => setFilter('governance', v)}
                  />
                </div>
                <FormField label={sportsText.programme.label}>
                  {(p) => (
                    <Select
                      {...p}
                      options={programmeOptions(tree)}
                      placeholder={sportsText.programme.all}
                      value={filters.programme ?? ''}
                      onChange={(e) => setFilter('programme', e.target.value || undefined)}
                    />
                  )}
                </FormField>
              </FilterBar>
              {visible.length > 0 ? <SportDirectory groups={visible} /> : <EmptyState title={t.noMatchTitle}>{t.noMatchText}</EmptyState>}
            </div>
          );
        }}
      </QueryBoundary>

      <Section variant="plain" title={sportsText.models.title} eyebrow={sportsText.models.eyebrow} className="mt-8">
        <QueryBoundary query={models} loading={<SkeletonList rows={2} className="h-24 w-full" />}>
          {(m) => <GovernanceModels models={m} />}
        </QueryBoundary>
      </Section>

      <QueryBoundary query={orgs} loading={<Skeleton className="h-20 w-full" />}>
        {(o) => <OrgHierarchy orgs={o} nature={filters.nature} onNatureChange={(v) => setFilter('nature', v)} />}
      </QueryBoundary>
    </PageLayout>
  );
}
