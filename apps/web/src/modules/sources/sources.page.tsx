import './sources.page.css';

import { SOURCE_USAGE_STATUS_VALUES, SourcesFiltersSchema } from '@was/shared';

import { collectionRunsQuery, sourcesQuery } from '@/data/endpoints/discovery.query';
import { useText } from '@/i18n/use-text.hook';
import { ChipToggleGroup } from '@/shared-ui/chip-toggle-group.component';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { KpiGrid } from '@/shared-ui/kpi-grid.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { Skeleton, SkeletonList } from '@/shared-ui/skeleton.component';
import { StatTile } from '@/shared-ui/stat-tile.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import { CollectionRuns } from './collection-runs.component';
import { SourceItem } from './source-item.component';
import { SOURCES_MESSAGES } from './sources.const';

const loading = (
  <>
    <Skeleton className="h-28 w-full rounded-(--r-lg)" />
    <SkeletonList rows={6} className="mt-6 h-16 w-full" />
  </>
);

/** P14 Sources (doc 09): KPIs by usage status · filterable registry · AI-assisted collection runs · the 6 primary origins. */
export function SourcesPage() {
  const T = useText(SOURCES_MESSAGES);
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const { filters, setFilter } = useUrlFilters(SourcesFiltersSchema);
  const sources = sourcesQuery.useQuery();
  const runs = collectionRunsQuery.useQuery();

  return (
    <PageLayout title={T.page.title} heading={T.page.heading} eyebrow={T.page.eyebrow} lead={T.page.lead} breadcrumb={[{ label: T.page.title }]}>
      <QueryBoundary
        query={sources}
        loading={loading}
        isEmpty={(s) => s.length === 0}
        empty={<EmptyState title={T.list.emptyTitle}>{T.list.emptyText}</EmptyState>}
      >
        {(all) => {
          const count = (status: (typeof SOURCE_USAGE_STATUS_VALUES)[number]) => all.filter((s) => s.usageStatus === status).length;
          const visible = filters.status ? all.filter((s) => s.usageStatus === filters.status) : all;
          return (
            <>
              <KpiGrid label={T.kpis.label}>
                {SOURCE_USAGE_STATUS_VALUES.map((status) => (
                  <StatTile key={status} label={T.kpis[status]} value={count(status)} />
                ))}
              </KpiGrid>
              <Section
                variant="plain"
                title={T.list.title}
                className="src-section"
                actions={
                  <ChipToggleGroup
                    label={T.list.filterLabel}
                    options={SOURCE_USAGE_STATUS_VALUES.map((value) => ({ value, label: T.list.chip(labels.sourceUsage[value], count(value)) }))}
                    value={filters.status}
                    onChange={(v) => setFilter('status', v)}
                  />
                }
              >
                {visible.length > 0 ? (
                  <ul className="src-list">
                    {visible.map((s) => (
                      <li key={s.slug}>
                        <SourceItem source={s} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">{T.list.noMatch}</p>
                )}
              </Section>
            </>
          );
        }}
      </QueryBoundary>

      <Section title={T.runs.title} eyebrow={T.runs.eyebrow}>
        <p className="muted max-w-[80ch] text-sm">{T.runs.intro}</p>
        <h3 className="label mt-4">{T.runs.gatesTitle}</h3>
        <ol className="src-gates">
          {T.runs.gates.map((g) => (
            <li key={g.title}>
              <b>{g.title}</b>
              {g.text}
            </li>
          ))}
        </ol>
        <div className="mt-4">
          <QueryBoundary query={runs} loading={<SkeletonList rows={2} />}>
            {(r) => <CollectionRuns runs={r} />}
          </QueryBoundary>
        </div>
      </Section>

      <Section variant="plain" title={T.origins.title} eyebrow={T.origins.eyebrow}>
        <ul className="src-origins">
          {T.origins.items.map((o) => (
            <li key={o.title} className="src-origin">
              <b>{o.title}</b>
              {o.text}
            </li>
          ))}
        </ul>
      </Section>
    </PageLayout>
  );
}
