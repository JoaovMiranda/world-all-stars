import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';

import { LAYOUT_MESSAGES, NAV_ITEMS } from './layout.const';

/** Main navigation links (doc 09 order: ★ Hall of Greats highlighted, Atletas, Esportes, Fontes, Contato). */
export function MainNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const t = useText(LAYOUT_MESSAGES);
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <Link key={item.to} to={item.to} className={item.featured ? 'nav-featured' : undefined} onClick={onNavigate}>
          {item.featured && <span aria-hidden="true">★ </span>}
          {t.links[item.labelKey]}
        </Link>
      ))}
    </>
  );
}
