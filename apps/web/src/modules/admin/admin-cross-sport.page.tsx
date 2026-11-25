import './admin.css';

import { Link } from '@tanstack/react-router';

import { crossSportUnmappedQuery } from '@/data/endpoints/cross-sport.query';
import { useText } from '@/i18n/use-text.hook';
import { DataTable } from '@/shared-ui/data-table.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { RequireSession } from '@/shared-ui/require-session.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { ADMIN_MESSAGES } from './admin.const';
import { ADMIN_CROSS_SPORT_MESSAGES } from './admin-cross-sport.const';
import { AdminNav } from './admin-nav.component';

/** T2.6 review list: competitive facts without a cross-sport mapping (typed errors from the engine run). */
export function AdminCrossSportPage() {
  const adminText = useText(ADMIN_MESSAGES);
  const T = useText(ADMIN_CROSS_SPORT_MESSAGES);
  const query = crossSportUnmappedQuery.useQuery();
  return (
    <PageLayout
      title={T.title}
      eyebrow={adminText.eyebrow}
      lead={T.lead}
      breadcrumb={[{ label: adminText.eyebrow, link: { to: '/admin' } }, { label: T.title }]}
    >
      {/* biome-ignore lint/a11y/useValidAriaRole: `role` is the user role required by RequireSession, not an ARIA role. */}
      <RequireSession role="admin">
        <div className="admin-shell">
          <AdminNav />
          <div className="stack admin-main">
            <QueryBoundary
              query={query}
              loading={<SkeletonList rows={6} />}
              isEmpty={(d) => d.total === 0}
              empty={<EmptyState title={T.emptyTitle}>{T.emptyText}</EmptyState>}
            >
              {(d) => (
                <>
                  <p className="muted">
                    {T.total(d.total)} · {d.rulesetVersion}
                  </p>
                  <DataTable
                    caption={T.caption}
                    captionHidden
                    rows={d.items}
                    rowKey={(r) => r.evidenceId}
                    initialSort={{ key: 'sport', dir: 'asc' }}
                    columns={[
                      { key: 'sport', header: T.sport, cell: (r) => r.sport, sortValue: (r) => r.sport },
                      { key: 'value', header: T.value, cell: (r) => <code>{r.value}</code>, sortValue: (r) => r.value },
                      { key: 'kind', header: T.kind, cell: (r) => T.kinds[r.kind] ?? r.kind },
                      { key: 'label', header: T.achievement, cell: (r) => r.label },
                      {
                        key: 'competitor',
                        header: T.competitor,
                        cell: (r) => (
                          <Link to="/athletes/$slug" params={{ slug: r.competitor.slug }}>
                            {r.competitor.name}
                          </Link>
                        ),
                        sortValue: (r) => r.competitor.name,
                      },
                      { key: 'year', header: T.year, cell: (r) => r.year ?? '—', sortValue: (r) => r.year, align: 'end' },
                    ]}
                  />
                </>
              )}
            </QueryBoundary>
            <p>
              <Link to="/rankings/all-sports/methodology">{T.methodologyLink}</Link>
            </p>
          </div>
        </div>
      </RequireSession>
    </PageLayout>
  );
}
