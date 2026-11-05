import { type ReactNode, useId } from 'react';

import { cx } from './class-names.helper';

export type SectionVariant = 'card' | 'gold' | 'mythic' | 'plain';

interface SectionProps {
  /** Heading of the card-head (h2 by default). */
  title?: ReactNode;
  /** Small caps label on the right of the head (or above the title with `eyebrowAbove`). */
  eyebrow?: ReactNode;
  actions?: ReactNode;
  /** card (default) · gold (achievement) · mythic (double gold frame) · plain (no box). */
  variant?: SectionVariant;
  /** Columns in a 12-col `.grid` parent. */
  span?: 4 | 8 | 12;
  headingLevel?: 2 | 3;
  id?: string;
  className?: string;
  busy?: boolean;
  children: ReactNode;
}

/** Titled block: card + card-head (title · eyebrow · actions), labelled by its heading. */
export function Section({ title, eyebrow, actions, variant = 'card', span, headingLevel = 2, id, className, busy, children }: SectionProps) {
  const headingId = useId();
  const H = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <section
      id={id}
      className={cx(variant === 'plain' ? 'card-plain' : 'card', variant === 'gold' && 'card-gold', variant === 'mythic' && 'card-mythic', span && `c-${span}`, className)}
      aria-labelledby={title ? headingId : undefined}
      aria-busy={busy || undefined}
    >
      {(title || eyebrow || actions) && (
        <div className="card-head">
          {title && <H id={headingId}>{title}</H>}
          {(eyebrow || actions) && (
            <div className="card-head-actions">
              {eyebrow && <span className="label">{eyebrow}</span>}
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
