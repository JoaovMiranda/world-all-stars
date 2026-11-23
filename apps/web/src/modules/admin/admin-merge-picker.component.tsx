import type { MergeCandidate } from '@was/shared';
import { useDeferredValue, useId, useState } from 'react';

import { mergeCandidatesQuery } from '@/data/endpoints/admin-merge.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { FormField } from '@/shared-ui/form-field.component';
import { SearchInput } from '@/shared-ui/search-input.component';

import { ADMIN_MERGE_MESSAGES } from './admin-merge.const';

interface MergePickerProps {
  /** Visible heading of the side ("A · stays"). */
  title: string;
  searchLabel: string;
  value: MergeCandidate | null;
  onPick: (candidate: MergeCandidate | null) => void;
}

/** One side of the merge: search by name or slug, choose a result, change it later. */
export function MergePicker({ title, searchLabel, value, onPick }: MergePickerProps) {
  const T = useText(ADMIN_MERGE_MESSAGES);
  const headingId = useId();
  const [q, setQ] = useState('');
  const term = useDeferredValue(q.trim());
  const query = mergeCandidatesQuery.useQuery({ query: { q: term } }, { enabled: !value && term.length >= 2 });
  const items = query.data?.items ?? [];
  return (
    <section className="merge-picker" aria-labelledby={headingId}>
      <h3 id={headingId}>{title}</h3>
      {value ? (
        <div className="merge-picked">
          <p>
            <span className="muted">{T.selected}: </span>
            <b>{value.name}</b> <small className="muted">/{value.slug}</small>
          </p>
          <Button size="sm" variant="ghost" onClick={() => onPick(null)} aria-label={`${T.change}: ${title}`}>
            {T.change}
          </Button>
        </div>
      ) : (
        <>
          <FormField label={searchLabel}>
            {(p) => <SearchInput {...p} inline value={q} placeholder={T.searchPlaceholder} onChange={(e) => setQ(e.target.value)} />}
          </FormField>
          {term.length >= 2 && (
            <div aria-live="polite">
              {query.isFetching && !items.length ? (
                <p className="muted">{T.searching}</p>
              ) : items.length ? (
                <ul className="merge-results" aria-label={T.resultsLabel(title)}>
                  {items.map((c) => (
                    <li key={c.id}>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          onPick(c);
                          setQ('');
                        }}
                        aria-label={T.chooseNamed(c.name)}
                      >
                        <span>
                          <b>{c.name}</b> <small className="muted">/{c.slug}</small>
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">{T.noResults}</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
