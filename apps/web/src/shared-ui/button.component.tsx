import type { ButtonHTMLAttributes, MouseEvent } from 'react';

import { buttonClass } from './button.helper';
import type { ButtonSize } from './button-size.type';
import type { ButtonVariant } from './button-variant.type';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary (gold) · secondary (outline, default) · ghost · link · danger */
  variant?: ButtonVariant;
  /** sm · md (default) · lg · icon (square, needs aria-label) */
  size?: ButtonSize;
  /**
   * Work in flight: shows a spinner, sets aria-busy + aria-disabled and ignores clicks. The button is NOT `disabled`:
   * a focused native-disabled button drops keyboard focus to <body> (WCAG 2.4.3), so it stays focusable instead.
   */
  pending?: boolean;
}

/** Native button with the design-system look. Defaults to type="button". */
export function Button({ variant, size, className, type = 'button', pending = false, disabled, children, onClick, ...rest }: ButtonProps) {
  const guardedClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      disabled={disabled}
      aria-disabled={pending || undefined}
      aria-busy={pending || undefined}
      onClick={guardedClick}
      {...rest}
    >
      {pending && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
