import { Link } from '@tanstack/react-router';

import { adminSummaryQuery } from '@/data/endpoints/admin.query';

import { ADMIN_TEXT } from './admin.const';
import { ADMIN_NAV_ORDER, ADMIN_SECTION_PATH } from './admin-routes.const';

/** Section navigation of the admin area with the pending counters (hidden while loading or on error). */
export function AdminNav() {
  const summary = adminSummaryQuery.useQuery();
  const pending = summary.data?.pending;
  return (
    <nav className="admin-nav" aria-label={ADMIN_TEXT.sectionsLabel}>
      <ul>
        <li>
          <Link to="/admin" activeOptions={{ exact: true, includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
            {ADMIN_TEXT.title}
          </Link>
        </li>
        {ADMIN_NAV_ORDER.map((section) => {
          const n = pending?.[section] ?? 0;
          return (
            <li key={section}>
              <Link to={ADMIN_SECTION_PATH[section]} activeOptions={{ includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
                <span>{ADMIN_TEXT.sections[section].title}</span>
                {n > 0 && (
                  <span className="admin-count">
                    <span aria-hidden="true">{n}</span>
                    <span className="sr-only">{ADMIN_TEXT.pending(n)}</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
