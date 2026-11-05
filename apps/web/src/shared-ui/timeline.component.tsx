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

/** Vertical timeline with art-déco diamonds (career, milestones, versions). */
export function Timeline({ items, label }: { items: readonly TimelineItem[]; label?: string }) {
  return (
    <ol className="timeline" aria-label={label}>
      {items.map((item) => (
        <li key={item.key}>
          <span className="when">{item.when}</span>
          <span className={item.tone && item.tone !== 'default' ? `dot ${item.tone}` : 'dot'} aria-hidden="true" />
          <span>
            <span className="timeline-title">{item.title}</span>
            {item.detail && <div className="timeline-detail">{item.detail}</div>}
          </span>
        </li>
      ))}
    </ol>
  );
}
