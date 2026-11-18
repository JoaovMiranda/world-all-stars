import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { UI_MESSAGES } from './ui-text.const';

interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/**
 * Numbered pagination (nav landmark with a list, aria-current on the current page). Hidden with a single page.
 * Previous/Next at the ends are aria-disabled, not disabled: a focused button that becomes disabled drops focus.
 */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const ui = useText(UI_MESSAGES);
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  const go = (p: number) => p >= 1 && p <= pageCount && p !== page && onChange(p);
  return (
    <nav className="pagination" aria-label={ui.paginationLabel}>
      <ul>
        <li>
          <Button size="sm" aria-disabled={page <= 1 || undefined} onClick={() => go(page - 1)}>
            {ui.previous}
          </Button>
        </li>
        {pages.map((p, i) => (
          <li key={p}>
            {i > 0 && p - (pages[i - 1] ?? p) > 1 && <span aria-hidden="true">…</span>}
            <Button size="sm" aria-label={ui.page(p)} aria-current={p === page ? 'page' : undefined} onClick={() => go(p)}>
              {p}
            </Button>
          </li>
        ))}
        <li>
          <Button size="sm" aria-disabled={page >= pageCount || undefined} onClick={() => go(page + 1)}>
            {ui.next}
          </Button>
        </li>
      </ul>
    </nav>
  );
}
