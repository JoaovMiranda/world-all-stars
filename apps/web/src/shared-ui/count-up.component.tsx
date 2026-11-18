import { useRef } from 'react';

import { useFormat } from '@/i18n/use-format.hook';

import { countAt, countDuration } from './count-up.helper';
import { useInViewOnce } from './use-reveal.hook';

interface CountUpProps {
  value: number;
  /** Formats the number (default: locale number format). Used for the final value and every frame. */
  format?: (n: number) => string;
  className?: string;
}

/**
 * Number that counts up from 0 when it scrolls into view. The server and screen readers always get the final value;
 * the animated digits are aria-hidden. Reduced motion: shows the value, no count.
 */
export function CountUp({ value, format, className }: CountUpProps) {
  const fmt = useFormat();
  const show = format ?? ((n: number) => fmt.number(n));
  const digits = useRef<HTMLSpanElement>(null);
  const final = show(value);

  useInViewOnce(digits, () => {
    const el = digits.current;
    if (!el || !Number.isFinite(value) || value === 0) return;
    const duration = countDuration(value);
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      el.textContent = show(countAt(t, value));
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = show(0);
    requestAnimationFrame(tick);
  });

  return (
    <span className={className ? `count-up ${className}` : 'count-up'}>
      {/* key: a new value gets a fresh node (the count writes textContent directly). */}
      <span key={final} ref={digits} aria-hidden="true">
        {final}
      </span>
      <span className="sr-only">{final}</span>
    </span>
  );
}
