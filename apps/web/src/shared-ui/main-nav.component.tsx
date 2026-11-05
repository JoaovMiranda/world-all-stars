import { Link } from '@tanstack/react-router';

import { NAV_ITEMS } from './layout.const';

/** Main navigation links (doc 09 order: ★ Hall of Greats highlighted, Atletas, Esportes, Fontes, Contato). */
export function MainNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <Link key={item.to} to={item.to} className={item.featured ? 'nav-featured' : undefined} onClick={onNavigate}>
          {item.featured && <span aria-hidden="true">★ </span>}
          {item.label}
        </Link>
      ))}
    </>
  );
}
