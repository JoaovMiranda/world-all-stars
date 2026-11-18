import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { UI_MESSAGES } from './ui-text.const';

interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}

/** Numbered pagination (nav landmark, aria-current on the current page). Hidden with a single page. */
export function Pagination({ page, pageCount, onChange }: PaginationProps) {
  const ui = useText(UI_MESSAGES);
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1);
  return (
    <nav className="pagination" aria-label={ui.paginationLabel}>
      <Button size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        {ui.previous}
      </Button>
      {pages.map((p, i) => (
        <span key={p} className="row">
          {i > 0 && p - (pages[i - 1] ?? p) > 1 && <span aria-hidden="true">…</span>}
          <Button size="sm" aria-label={ui.page(p)} aria-current={p === page ? 'page' : undefined} onClick={() => onChange(p)}>
            {p}
          </Button>
        </span>
      ))}
      <Button size="sm" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
        {ui.next}
      </Button>
    </nav>
  );
}
