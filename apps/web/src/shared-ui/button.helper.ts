import { cx } from './class-names.helper';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

/** Class list of a button-looking element (used by Button and ButtonLink, so both stay identical). */
export const buttonClass = (variant: ButtonVariant = 'secondary', size: ButtonSize = 'md', extra?: string): string =>
  cx('btn', `btn-${variant}`, size === 'sm' && 'btn-sm', size === 'lg' && 'btn-lg', size === 'icon' && 'icon-btn', extra);
