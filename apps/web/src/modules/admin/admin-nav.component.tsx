import { Link } from '@tanstack/react-router';

import { adminSummaryQuery } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';

import { ADMIN_MESSAGES } from './admin.const';
import { ADMIN_CROSS_SPORT_MESSAGES } from './admin-cross-sport.const';
import { ADMIN_MERGE_MESSAGES } from './admin-merge.const';
import { ADMIN_NAV_GROUPS, ADMIN_SECTION_PATH } from './admin-routes.const';

/** Section navigation of the admin area with the pending counters (hidden while loading or on error). */
export function AdminNav() {
  const adminText = useText(ADMIN_MESSAGES);
  const mergeText = useText(ADMIN_MERGE_MESSAGES);
  const crossSportText = useText(ADMIN_CROSS_SPORT_MESSAGES);
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
      </ul>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.key} className="admin-nav-group" role="group" aria-labelledby={`admin-nav-${group.key}`}>
          <p className="admin-nav-label" id={`admin-nav-${group.key}`}>
            {adminText.navGroups[group.key]}
          </p>
          <ul>
            {group.sections.map((section) => {
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
        </div>
      ))}
      <div className="admin-nav-group" role="group" aria-labelledby="admin-nav-identity">
        <p className="admin-nav-label" id="admin-nav-identity">
          {mergeText.navGroup}
        </p>
        <ul>
          <li>
            <Link to="/admin/merge" activeProps={{ 'aria-current': 'page' }}>
              <span>{mergeText.navLink}</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="admin-nav-group" role="group" aria-labelledby="admin-nav-cross-sport">
        <p className="admin-nav-label" id="admin-nav-cross-sport">
          {crossSportText.navGroup}
        </p>
        <ul>
          <li>
            <Link to="/admin/cross-sport" activeProps={{ 'aria-current': 'page' }}>
              <span>{crossSportText.navLink}</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
}
