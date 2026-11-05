import './review-kit.css';

import { type ReactNode, useRef } from 'react';

import { EmptyState } from './empty-state.component';
import { REVIEW_KIT_TEXT } from './review-kit.const';

interface ReviewQueueProps<T> {
  /** Accessible name of the list. */
  label: string;
  items: readonly T[];
  getKey: (item: T) => string;
  /** Selected key (keep it in the URL, `?item=`); falls back to the first item. */
  selectedKey: string | undefined;
  onSelect: (key: string) => void;
  /** Content of each list button (title, tags, meta). */
  renderItem: (item: T) => ReactNode;
  /** Detail panel of the selected item (diff, evidence, decision bar…). */
  renderDetail: (item: T) => ReactNode;
  emptyTitle: string;
  emptyText?: ReactNode;
  detailLabel?: string;
}

/**
 * Master–detail queue: selectable list on the left, detail panel on the right (stacked below 960 px, where
 * selecting moves focus to the detail). Used by every admin queue.
 */
export function ReviewQueue<T>({ label, items, getKey, selectedKey, onSelect, renderItem, renderDetail, emptyTitle, emptyText, detailLabel = REVIEW_KIT_TEXT.queueDetail }: ReviewQueueProps<T>) {
  const detailRef = useRef<HTMLElement>(null);
  if (items.length === 0) return <EmptyState title={emptyTitle} compact>{emptyText}</EmptyState>;
  const selected = items.find((i) => getKey(i) === selectedKey) ?? items[0]!;
  const select = (key: string) => {
    onSelect(key);
    if (window.matchMedia('(max-width: 960px)').matches) requestAnimationFrame(() => detailRef.current?.focus());
  };
  return (
    <div className="review-queue">
      <ul className="review-queue-list" aria-label={label}>
        {items.map((item) => {
          const key = getKey(item);
          return (
            <li key={key}>
              <button type="button" className="review-queue-item" aria-current={item === selected ? 'true' : undefined} onClick={() => select(key)}>
                {renderItem(item)}
              </button>
            </li>
          );
        })}
      </ul>
      <section ref={detailRef} className="review-queue-detail card" aria-label={detailLabel} tabIndex={-1}>
        {renderDetail(selected)}
      </section>
    </div>
  );
}
