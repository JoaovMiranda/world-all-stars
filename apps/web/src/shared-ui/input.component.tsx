import { forwardRef, type InputHTMLAttributes } from 'react';

import { cx } from './class-names.helper';

/** Text input with the design-system look. Use inside FormField: `{(p) => <Input {...p} />}`. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={cx('input', className)} {...rest} />;
});
