import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from './class-names.helper';
import { tokenColor } from './format.helper';

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  children: ReactNode;
  /** Toggle state (aria-pressed). Omit for a plain action chip. */
  pressed?: boolean;
  /** Dim when not pressed (filters that hide things). */
  toggle?: boolean;
  /** Color token of a leading swatch (e.g. sport color). */
  swatch?: string;
}

/** Pill button used for filters and quick choices. */
export function Chip({ children, pressed, toggle = false, swatch, className, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} className={cx('chip', toggle && 'chip-toggle', className)} aria-pressed={pressed} {...rest}>
      {swatch && <span className="swatch" style={{ background: tokenColor(swatch) }} aria-hidden="true" />}
      {children}
    </button>
  );
}
