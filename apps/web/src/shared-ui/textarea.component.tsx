import { forwardRef, type TextareaHTMLAttributes } from 'react';

import { cx } from './class-names.helper';

/** Multi-line text with the design-system look. Pair with <CharCounter/> in FormField's `counter`. */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={cx('textarea', className)} {...rest} />;
});
