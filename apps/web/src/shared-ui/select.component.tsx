import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cx } from './class-names.helper';
import type { SelectOption } from './select-option.interface';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Options to render (or pass <option> children). */
  options?: readonly SelectOption[];
  /** First empty option (e.g. "Todos"). */
  placeholder?: string;
}

/** Native select (best a11y on mobile) with the design-system look. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, options, placeholder, children, ...rest }, ref) {
  return (
    <select ref={ref} className={cx('select', className)} {...rest}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
      {children}
    </select>
  );
});
