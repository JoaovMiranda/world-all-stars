import { forwardRef, type InputHTMLAttributes, useEffect, useState } from 'react';

import { cx } from './class-names.helper';

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Accessible name (visible placeholder is not a label). Omit inside a FormField: its visible <label> names it (WCAG 2.5.3). */
  label?: string;
  /** Show the Ctrl+K / ⌘K shortcut hint. */
  shortcut?: boolean;
  /** Inline (filter bar) instead of the centered header style. */
  inline?: boolean;
}

/** Pill search field (⌕ + input + optional Ctrl+K hint). Wrap in <form role="search"> when it submits. */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput({ label, shortcut = false, inline = false, className, ...rest }, ref) {
  // "Ctrl K" on the server and most systems; "⌘K" on Apple devices once hydrated (the hint is aria-hidden).
  const [keyHint, setKeyHint] = useState('Ctrl K');
  useEffect(() => {
    if (shortcut && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent)) setKeyHint('⌘K');
  }, [shortcut]);
  return (
    <div className={cx('search', inline && 'search-inline', className)}>
      <span aria-hidden="true">⌕</span>
      <input ref={ref} type="search" aria-label={label} autoComplete="off" {...rest} />
      {shortcut && <kbd aria-hidden="true">{keyHint}</kbd>}
    </div>
  );
});
