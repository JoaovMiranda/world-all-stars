import { cleanText, codePointLength } from '@was/shared';

import { cx } from './class-names.helper';

interface CharCounterProps {
  value: string;
  max: number;
}

/** Live "n/500" counter: counts code points after cleaning (same rule as the server, doc 20); red above the limit. */
export function CharCounter({ value, max }: CharCounterProps) {
  const length = codePointLength(cleanText(value));
  return (
    <span className={cx('char-counter', length > max && 'over')} aria-live="polite">
      {length}/{max}
    </span>
  );
}
