import { Link } from '@tanstack/react-router';

import { FOOTER_LEGAL_LINKS, FOOTER_PROJECT_LINKS, LAYOUT_TEXT, NAV_ITEMS } from './layout.const';

const COLUMNS = [
  { label: LAYOUT_TEXT.footerExplore, items: NAV_ITEMS },
  { label: LAYOUT_TEXT.footerProject, items: FOOTER_PROJECT_LINKS },
  { label: LAYOUT_TEXT.footerLegal, items: FOOTER_LEGAL_LINKS },
] as const;

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div>
          <div className="logo logo-sm">
            <i aria-hidden="true" />
            {LAYOUT_TEXT.brand}
          </div>
          <p className="mt-2">{LAYOUT_TEXT.footerSources}</p>
          <p className="mt-1.5">{LAYOUT_TEXT.footerNote}</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.label} aria-label={col.label}>
            <span className="label">{col.label}</span>
            <ul>
              {col.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
