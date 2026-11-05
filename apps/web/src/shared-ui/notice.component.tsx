import type { ReactNode } from 'react';

import { cx } from './class-names.helper';

export type NoticeTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
const ICON: Record<NoticeTone, string> = { neutral: '◇', info: 'i', success: '✓', warning: '!', danger: '!' };

interface NoticeProps {
  children: ReactNode;
  tone?: NoticeTone;
  /** Announce politely (form results) or assertively (errors). */
  live?: 'polite' | 'assertive';
  className?: string;
}

/** Inline message box (hints, results of a form, warnings about sources). */
export function Notice({ children, tone = 'neutral', live, className }: NoticeProps) {
  return (
    <div className={cx('notice', tone !== 'neutral' && `notice-${tone}`, className)} {...(live ? { role: live === 'assertive' ? 'alert' : 'status' } : {})}>
      <span className="notice-icon" aria-hidden="true">
        {ICON[tone]}
      </span>
      <div>{children}</div>
    </div>
  );
}
