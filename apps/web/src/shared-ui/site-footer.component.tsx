import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';

import { FOOTER_LEGAL_LINKS, FOOTER_PROJECT_LINKS, LAYOUT_MESSAGES, NAV_ITEMS } from './layout.const';

const COLUMNS = [
  { key: 'footerExplore', items: NAV_ITEMS },
  { key: 'footerProject', items: FOOTER_PROJECT_LINKS },
  { key: 'footerLegal', items: FOOTER_LEGAL_LINKS },
] as const;

export function SiteFooter() {
  const t = useText(LAYOUT_MESSAGES);
  return (
    <footer className="site-footer">
      <div className="wrap cols">
        <div>
          <div className="logo logo-sm">
            <i aria-hidden="true" />
            {t.brand}
          </div>
          <p className="mt-2">{t.footerSources}</p>
          <p className="mt-1.5">{t.footerNote}</p>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.key} aria-label={t[col.key]}>
            <span className="label">{t[col.key]}</span>
            <ul>
              {col.items.map((item) => (
                <li key={item.to}>
                  <Link to={item.to}>{t.links[item.labelKey]}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
    </footer>
  );
}
