import { Link } from '@tanstack/react-router';

import { adminSummaryQuery } from '@/data/endpoints/admin.query';
import { KpiGrid } from '@/shared-ui/kpi-grid.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatTile } from '@/shared-ui/stat-tile.component';

import { ADMIN_TEXT } from './admin.const';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_NAV_ORDER, ADMIN_SECTION_PATH } from './admin-routes.const';

/** Painel: pending counters per section + shortcuts to A1–A8. */
export function AdminHomePage() {
  const summary = adminSummaryQuery.useQuery();
  return (
    <AdminLayout>
      <QueryBoundary query={summary} loading={<SkeletonList rows={2} className="h-24 w-full" />}>
        {({ pending }) => (
          <KpiGrid columns={4} label={ADMIN_TEXT.home.kpisLabel}>
            {ADMIN_NAV_ORDER.map((s) => (
              <StatTile key={s} label={ADMIN_TEXT.sections[s].title} value={pending[s]} hint={pending[s] ? ADMIN_TEXT.pending(pending[s]) : ADMIN_TEXT.home.allClear} />
            ))}
          </KpiGrid>
        )}
      </QueryBoundary>
      <Section title={ADMIN_TEXT.home.shortcutsTitle}>
        <div className="admin-shortcuts">
          {ADMIN_NAV_ORDER.map((s) => (
            <Link key={s} to={ADMIN_SECTION_PATH[s]} className="admin-shortcut">
              <b>{ADMIN_TEXT.sections[s].title}</b>
              <small>{ADMIN_TEXT.sections[s].lead}</small>
            </Link>
          ))}
        </div>
      </Section>
    </AdminLayout>
  );
}
