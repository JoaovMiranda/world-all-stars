import type { ReactNode } from 'react';

export interface TimelineItem {
  key: string;
  /** Left column (year or DateLink). */
  when: ReactNode;
  title: ReactNode;
  detail?: ReactNode;
  /** gold = achievement, muted = minor, default = neutral diamond. */
  tone?: 'gold' | 'muted' | 'default';
}
