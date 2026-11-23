import { getRouteApi, Link } from '@tanstack/react-router';
import type { RankingEntry } from '@was/shared';
import { useState } from 'react';

import { rankingDetailQuery } from '@/data/endpoints/rankings.query';
import { useText } from '@/i18n/use-text.hook';
import type { DataColumn } from '@/shared-ui/data-column.interface';
import { DataTable } from '@/shared-ui/data-table.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { Pagination } from '@/shared-ui/pagination.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { RANKINGS_MESSAGES } from './rankings.const';

const route = getRouteApi('/rankings/$id');
const PAGE_SIZE = 50;

/** One published ranking: positions (ties shared), the methodology metrics, and the reproduction hash. */
export function RankingPage() {
  const t = useText(RANKINGS_MESSAGES).detail;
  const { id } = route.useParams();
  const [page, setPage] = useState(1);
  const query = rankingDetailQuery.useQuery({ params: { id }, query: { page, pageSize: PAGE_SIZE } });
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
            <DataTable caption={data.snapshot.title} captionHidden columns={columns} rows={data.entries} rowKey={(e) => e.competitor.id} />
            <Pagination page={data.page} pageCount={Math.max(1, Math.ceil(data.total / data.pageSize))} onChange={setPage} />
            <p className="muted mt-4">
              {t.hash}: <code>{data.snapshot.outputHash.slice(0, 16)}</code>
            </p>
          </PageLayout>
        );
      }}
    </QueryBoundary>
  );
}
