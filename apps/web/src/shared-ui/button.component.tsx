import type { ButtonHTMLAttributes } from 'react';

import { type ButtonSize, type ButtonVariant, buttonClass } from './button.helper';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** primary (gold) · secondary (outline, default) · ghost · link · danger */
  variant?: ButtonVariant;
  /** sm · md (default) · lg · icon (square, needs aria-label) */
  size?: ButtonSize;
}

/** Native button with the design-system look. Defaults to type="button". */
export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, size, className)} {...rest} />;
}
