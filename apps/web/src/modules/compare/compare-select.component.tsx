import type { AthleteSummary, HeadToHeadSearch } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Select } from '@/shared-ui/select.component';

import { COMPARE_MESSAGES } from './compare.const';

interface CompareSelectProps {
  value: HeadToHeadSearch;
  /** Every competitor that can be chosen. */
  candidates: readonly AthleteSummary[];
  onChange: (next: HeadToHeadSearch) => void;
}

/** Two native selects (best on mobile; type-ahead by name) and a swap button; the choice lives in the URL. */
export function CompareSelect({ value, candidates, onChange }: CompareSelectProps) {
  const t = useText(COMPARE_MESSAGES).page;
  const options = candidates.map((c) => ({ value: c.slug, label: `${c.knownAs} · ${c.sport.name}` }));
  const field = (side: 'a' | 'b', label: string) => (
    <FormField label={label}>
      {(p) => (
        <Select
          {...p}
          placeholder={t.choose}
          options={options}
          value={value[side] ?? ''}
          onChange={(e) => onChange({ ...value, [side]: e.target.value || undefined })}
        />
      )}
    </FormField>
  );
  return (
    <fieldset className="compare-select">
      <legend className="sr-only">{t.pickerLabel}</legend>
      {field('a', t.sideA)}
      <Button variant="ghost" className="compare-swap" disabled={!value.a && !value.b} onClick={() => onChange({ a: value.b, b: value.a })}>
        <span aria-hidden="true">⇄ </span>
        {t.swap}
      </Button>
      {field('b', t.sideB)}
    </fieldset>
  );
}
