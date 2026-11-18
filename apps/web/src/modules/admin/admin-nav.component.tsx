import { Link } from '@tanstack/react-router';

import { adminSummaryQuery } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';

import { ADMIN_MESSAGES } from './admin.const';
import { ADMIN_NAV_ORDER, ADMIN_SECTION_PATH } from './admin-routes.const';

/** Section navigation of the admin area with the pending counters (hidden while loading or on error). */
export function AdminNav() {
  const adminText = useText(ADMIN_MESSAGES);
  const summary = adminSummaryQuery.useQuery();
  const pending = summary.data?.pending;
  return (
    <nav className="admin-nav" aria-label={adminText.sectionsLabel}>
      <ul>
        <li>
          <Link to="/admin" activeOptions={{ exact: true, includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
            {adminText.title}
          </Link>
        </li>
        {ADMIN_NAV_ORDER.map((section) => {
          const n = pending?.[section] ?? 0;
          return (
            <li key={section}>
              <Link to={ADMIN_SECTION_PATH[section]} activeOptions={{ includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
                <span>{adminText.sections[section].title}</span>
                {n > 0 && (
                  <span className="admin-count">
                    <span aria-hidden="true">{n}</span>
                    <span className="sr-only">{adminText.pending(n)}</span>
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
