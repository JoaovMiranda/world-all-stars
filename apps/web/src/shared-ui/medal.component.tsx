import type { ReactNode } from 'react';

import { MEDAL_LABEL } from './domain-labels.const';

export type MedalMetal = keyof typeof MEDAL_LABEL;

interface MedalProps {
  metal: MedalMetal;
  /** Content inside the disc (a count, a rank). Defaults to nothing (decorative disc with accessible label). */
  children?: ReactNode;
}

/** Olympic-style medal disc with the real metal gradient (gold/silver/bronze tokens). */
export function Medal({ metal, children }: MedalProps) {
  return (
    <span className={`medal medal-${metal}`} role="img" aria-label={children === undefined ? MEDAL_LABEL[metal] : `${MEDAL_LABEL[metal]}: ${String(children)}`}>
      <span aria-hidden="true">{children}</span>
    </span>
  );
}
