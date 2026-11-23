import { useRef } from 'react';
import type { TimelineItem } from './timeline-item.interface';
import { useReveal } from './use-reveal.hook';

/** Vertical timeline with art-deco diamonds (career, milestones, versions). */
export function Timeline({ items, label }: { items: readonly TimelineItem[]; label?: string }) {
  const ref = useRef<HTMLOListElement>(null);
  useReveal(ref, { stagger: true, settleMs: 2400 });
  return (
    <ol ref={ref} className="timeline" aria-label={label}>
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
