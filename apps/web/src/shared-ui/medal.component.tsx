import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { DOMAIN_LABELS_MESSAGES } from './domain-labels.const';

export type MedalMetal = 'gold' | 'silver' | 'bronze';

interface MedalProps {
  metal: MedalMetal;
  /** Content inside the disc (a count, a rank). Defaults to nothing (decorative disc with accessible label). */
  children?: ReactNode;
}

/** Olympic-style medal disc with the real metal gradient (gold/silver/bronze tokens). */
export function Medal({ metal, children }: MedalProps) {
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  return (
    <span className={`medal medal-${metal}`} role="img" aria-label={children === undefined ? labels.medal[metal] : `${labels.medal[metal]}: ${String(children)}`}>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
