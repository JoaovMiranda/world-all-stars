import { getRouteApi, Link } from '@tanstack/react-router';
import {
  RANKING_FILTER_KEYS_BY_METHODOLOGY,
  RankingDetailSearchSchema,
  type RankingDetailSearch,
  type RankingEntry,
  RankingFilterFieldsSchema,
  type RankingFilterKey,
  type RankingSort,
} from '@was/shared';

import { rankingDetailQuery, rankingFilterOptionsQuery } from '@/data/endpoints/rankings.query';
import { useText } from '@/i18n/use-text.hook';
import type { DataColumn } from '@/shared-ui/data-column.interface';
import { DataTable } from '@/shared-ui/data-table.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { Pagination } from '@/shared-ui/pagination.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { SourceAttribution } from '@/shared-ui/source-attribution.component';
import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';
import { METHODOLOGY_MESSAGES } from './methodology.const';
import { RankingFilters } from './ranking-filters.component';
import { RANKINGS_MESSAGES } from './rankings.const';
import { rankingDetailInput, rankingFilterOptionsInput } from './rankings-query.helper';

const route = getRouteApi('/rankings/$id');

/** One published ranking: positions (ties shared), the methodology metrics, URL filters (T2.5) and the reproduction hash. */
export function RankingPage() {
  const messages = useText(RANKINGS_MESSAGES);
  const t = messages.detail;
  const methodologyText = useText(METHODOLOGY_MESSAGES);
  const { id } = route.useParams();
  const { filters: search, setFilters, reset } = useUrlFilters(RankingDetailSearchSchema);
  const query = rankingDetailQuery.useQuery(rankingDetailInput(id, search));
  const options = rankingFilterOptionsQuery.useQuery(rankingFilterOptionsInput(id));
  const methodologyKeys = options.data ? (RANKING_FILTER_KEYS_BY_METHODOLOGY[options.data.methodology] ?? []) : [];
  const activeCount = methodologyKeys.filter((k) => search[k] !== undefined).length;
  // A filter change goes back to page 1; the value is sanitized by the same schema as the URL (edition → number…).
  const onFilter = (key: RankingFilterKey, raw: string) =>
    setFilters({ [key]: RankingFilterFieldsSchema.shape[key].parse(raw === '' ? undefined : raw), page: undefined } as Partial<RankingDetailSearch>);
  const onSort = (sort: RankingSort | undefined) => setFilters({ sort, page: undefined });
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={10} />} notFound={<EmptyState title={t.notFoundTitle}>{t.notFoundText}</EmptyState>}>
      {(data) => {
        const metricKeys = [...new Set(data.entries.flatMap((e) => Object.keys(e.metrics)))].filter((k) => k in t.metrics);
        const columns: DataColumn<RankingEntry>[] = [
          { key: 'rank', header: t.rank, align: 'end', cell: (e) => (e.rank ? `${e.rank}${e.rankTied ? ` (${t.tied})` : ''}` : t.notEligible) },
          {
            key: 'competitor',
            header: t.competitor,
            cell: (e) =>
              e.competitor.hasProfile && e.competitor.slug ? (
                <Link to="/athletes/$slug" params={{ slug: e.competitor.slug }}>
                  {e.competitor.name}
                </Link>
              ) : (
                e.competitor.name
              ),
          },
          { key: 'score', header: t.score, align: 'end', cell: (e) => e.score ?? '—' },
          ...metricKeys.map((k) => ({ key: k, header: t.metrics[k] ?? k, align: 'end' as const, cell: (e: RankingEntry) => e.metrics[k] ?? '—' })),
        ];
        return (
          <PageLayout
            title={data.snapshot.title}
            eyebrow={`${data.snapshot.methodology} · v${data.snapshot.methodologyVersion}`}
            breadcrumb={[{ label: t.breadcrumb, link: { to: '/rankings' } }, { label: data.snapshot.title }]}
          >
            {options.data && (
              <RankingFilters
                filters={options.data.filters}
                search={search}
                onFilter={onFilter}
                onSort={onSort}
                onReset={reset}
                activeCount={activeCount}
                resultCount={activeCount > 0 ? data.total : undefined}
              />
            )}
            {data.total === 0 && activeCount > 0 ? (
              <EmptyState title={messages.filters.noResultsTitle}>{messages.filters.noResultsText}</EmptyState>
            ) : (
              <DataTable caption={data.snapshot.title} captionHidden columns={columns} rows={data.entries} rowKey={(e) => e.competitor.id} />
            )}
            <Pagination page={data.page} pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))} onChange={(page) => setFilters({ page })} />
            <p className="muted mt-4">
              {t.hash}: <code>{data.snapshot.outputHash.slice(0, 16)}</code>
            </p>
            {data.snapshot.sport === 'football' && <SourceAttribution source="fjelstul" className="mt-2" />}
            <p className="mt-2">
              <Link to="/rankings/$key/methodology" params={{ key: data.snapshot.methodology }}>
                {methodologyText.link}
              </Link>
            </p>
          </PageLayout>
        );
      }}
    </QueryBoundary>
  );
}
