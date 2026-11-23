import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
  /** Decorative mark shown above the title (default: art deco diamond). */
  mark?: string;
  action?: ReactNode;
  compact?: boolean;
}

/** Friendly "nothing here yet" block, used by every section when the database has no data. */
export function EmptyState({ title, children, mark = '◆', action, compact = false }: EmptyStateProps) {
  return (
    <div className={compact ? 'empty-state empty-state-compact' : 'empty-state'}>
      <span className="empty-state-mark" aria-hidden="true">
        {mark}
      </span>
      <p className="empty-state-title">{title}</p>
      {children && <div className="empty-state-text">{children}</div>}
      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}
