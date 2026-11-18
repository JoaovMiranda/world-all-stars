import { Link } from '@tanstack/react-router';

import { adminSummaryQuery } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { KpiGrid } from '@/shared-ui/kpi-grid.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatTile } from '@/shared-ui/stat-tile.component';

import { ADMIN_MESSAGES } from './admin.const';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_NAV_ORDER, ADMIN_SECTION_PATH } from './admin-routes.const';

/** Painel: pending counters per section + shortcuts to A1–A8. */
export function AdminHomePage() {
  const adminText = useText(ADMIN_MESSAGES);
  const summary = adminSummaryQuery.useQuery();
  return (
    <AdminLayout>
      <QueryBoundary query={summary} loading={<SkeletonList rows={2} className="h-24 w-full" />}>
        {({ pending }) => (
          <KpiGrid columns={4} label={adminText.home.kpisLabel}>
            {ADMIN_NAV_ORDER.map((s) => (
              <StatTile key={s} label={adminText.sections[s].title} value={pending[s]} hint={pending[s] ? adminText.pending(pending[s]) : adminText.home.allClear} />
            ))}
          </KpiGrid>
        )}
      </QueryBoundary>
      <Section title={adminText.home.shortcutsTitle}>
        <div className="admin-shortcuts">
          {ADMIN_NAV_ORDER.map((s) => (
            <Link key={s} to={ADMIN_SECTION_PATH[s]} className="admin-shortcut">
              <b>{adminText.sections[s].title}</b>
              <small>{adminText.sections[s].lead}</small>
            </Link>
          ))}
        </div>
      </Section>
    </AdminLayout>
  );
}
