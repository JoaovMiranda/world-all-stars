import { forwardRef, type InputHTMLAttributes } from 'react';

import { cx } from './class-names.helper';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Accessible name (visible placeholder is not a label). */
  label: string;
  /** Show the "/" shortcut hint. */
  shortcut?: boolean;
  /** Inline (filter bar) instead of the centered header style. */
  inline?: boolean;
}

/** Pill search field (⌕ + input + optional "/" hint). Wrap in <form role="search"> when it submits. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput({ label, shortcut = false, inline = false, className, ...rest }, ref) {
  return (
    <div className={cx('search', inline && 'search-inline', className)}>
      <span aria-hidden="true">⌕</span>
      <input ref={ref} type="search" aria-label={label} autoComplete="off" {...rest} />
      {shortcut && <kbd aria-hidden="true">/</kbd>}
    </div>
  );
});
