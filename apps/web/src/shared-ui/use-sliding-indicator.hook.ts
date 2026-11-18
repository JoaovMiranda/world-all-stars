import { type RefObject, useEffect } from 'react';

/**
 * Sliding underline (follow-through): measures the active child of `ref` (matched by `activeSelector`) and writes
 * its position to `--ind-x` / `--ind-w` on the container, so a CSS `::after` can glide between items.
 *
 * - SSR-safe: nothing runs until the effect; before that the CSS keeps the per-item underline.
 * - Sets `data-indicator="ready"` after the first measurement and `"moving"` one frame later, so the first
 *   placement does not animate from 0 (only later changes slide).
 * - `data-indicator-hidden` is set when nothing matches (e.g. a page outside the nav).
 * - Re-measures on resize (fonts loading, viewport changes).
 */
export function useSlidingIndicator(ref: RefObject<HTMLElement | null>, activeSelector: string, key: unknown): void {
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const measure = () => {
      const active = container.querySelector<HTMLElement>(activeSelector);
      if (!active) {
        container.setAttribute('data-indicator-hidden', '');
        return;
      }
      container.removeAttribute('data-indicator-hidden');
      container.style.setProperty('--ind-x', `${active.offsetLeft}px`);
      container.style.setProperty('--ind-w', `${active.offsetWidth}px`);
    };

    measure();
    let frame = 0;
    if (container.dataset.indicator !== 'moving') {
      container.dataset.indicator = 'ready';
      frame = requestAnimationFrame(() => {
        frame = requestAnimationFrame(() => {
          container.dataset.indicator = 'moving';
        });
      });
    }

    // Items change width when web fonts load, so watch them as well as the container.
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const child of Array.from(container.children)) observer.observe(child);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [ref, activeSelector, key]);
}
