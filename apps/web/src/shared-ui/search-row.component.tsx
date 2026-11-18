import { useNavigate } from '@tanstack/react-router';
import { type FormEvent, useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { LAYOUT_MESSAGES } from './layout.const';
import { SearchInput } from './search-input.component';
import { useSlashFocus } from './use-slash-focus.hook';

/** Search row below the header (doc 09): leads to the athletes list filtered by name; "/" focuses it. */
export function SearchRow() {
  const layout = useText(LAYOUT_MESSAGES);
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
        <form role="search" aria-label={layout.searchLabel} onSubmit={onSubmit}>
          <SearchInput ref={inputRef} name="q" label={layout.searchLabel} placeholder={layout.searchPlaceholder} shortcut />
        </form>
      </div>
    </div>
  );
}
