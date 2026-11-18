import { cleanText, codePointLength } from '@was/shared';
import { useEffect, useRef, useState } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { cx } from './class-names.helper';
import { UI_MESSAGES } from './ui-text.const';

interface CharCounterProps {
  value: string;
  max: number;
}

type Zone = 'ok' | 'near' | 'over';
const zoneOf = (length: number, max: number): Zone => (length > max ? 'over' : length >= max * 0.9 ? 'near' : 'ok');

/**
 * Visible "n/500" counter: counts code points after cleaning (same rule as the server, doc 20); red above the limit.
 * Screen readers are not told every keystroke (that drowns the typing): only when the text gets near the limit or
 * goes over it (WCAG 4.1.3 without noise).
 */
export function CharCounter({ value, max }: CharCounterProps) {
  const ui = useText(UI_MESSAGES);
  const length = codePointLength(cleanText(value));
  const zone = zoneOf(length, max);
  const lastZone = useRef<Zone>(zone);
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (zone === lastZone.current) return;
    lastZone.current = zone;
    setMessage(zone === 'over' ? ui.charsOver(length - max) : zone === 'near' ? ui.charsLeft(max - length) : '');
  }, [zone, length, max, ui]);
  return (
    <>
      <span className={cx('char-counter', length > max && 'over')} aria-hidden="true">
        {length}/{max}
      </span>
      <span className="sr-only" aria-live="polite">
        {message}
      </span>
    </>
  );
}
