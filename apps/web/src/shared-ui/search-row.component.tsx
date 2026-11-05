import { useNavigate } from '@tanstack/react-router';
import { type FormEvent, useRef } from 'react';

import { LAYOUT_TEXT } from './layout.const';
import { SearchInput } from './search-input.component';
import { useSlashFocus } from './use-slash-focus.hook';

/** Search row below the header (doc 09): leads to the athletes list filtered by name; "/" focuses it. */
export function SearchRow() {
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useSlashFocus(inputRef);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = inputRef.current?.value.trim() ?? '';
    void navigate({ to: '/athletes', search: q ? { q } : {} });
  };

  return (
    <div className="search-row">
      <div className="wrap">
        <form role="search" onSubmit={onSubmit}>
          <SearchInput ref={inputRef} name="q" label={LAYOUT_TEXT.searchLabel} placeholder={LAYOUT_TEXT.searchPlaceholder} shortcut />
        </form>
      </div>
    </div>
  );
}
