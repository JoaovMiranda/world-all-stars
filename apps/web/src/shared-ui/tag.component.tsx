import type { ReactNode } from 'react';

import { cx } from './class-names.helper';

export type TagTone = 'default' | 'soft' | 'gold' | 'success' | 'danger' | 'info';

interface TagProps {
  children: ReactNode;
  /** default (muted outline) · soft (sentence case, neutral) · gold · success · danger · info */
  tone?: TagTone;
  className?: string;
  title?: string;
}

/** Small uppercase label with 1px border (4 px radius). Use TierTag/LevelTag for tiers and levels. */
export function Tag({ children, tone = 'default', className, title }: TagProps) {
  return (
    <span className={cx('tag', tone !== 'default' && `tag-${tone}`, className)} title={title}>
      {children}
    </span>
  );
}
