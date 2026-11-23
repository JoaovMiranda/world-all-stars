import { Link, type LinkProps } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';
import type { BreadcrumbItem } from './breadcrumb-item.interface';
import { UI_MESSAGES } from './ui-text.const';

/** "Início › Atletas › Pelé" trail (nav landmark + ordered list; the home is implicit and always first). */
export function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  const ui = useText(UI_MESSAGES);
  return (
    <nav className="breadcrumb" aria-label={ui.breadcrumbLabel}>
      <ol>
        <li>
          <Link to="/">{ui.home}</Link>
        </li>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`}>
            <span aria-hidden="true">›</span>
            {item.link && i < items.length - 1 ? <Link {...(item.link as LinkProps)}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
