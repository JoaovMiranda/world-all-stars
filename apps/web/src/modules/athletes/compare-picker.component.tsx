import { ANALYSIS_MAX_ATHLETES, type AthleteSummary } from '@was/shared';

import { Chip } from '@/shared-ui/chip.component';
import { FormField } from '@/shared-ui/form-field.component';
import { Select } from '@/shared-ui/select.component';

import { ATHLETE_PROFILE_TEXT } from './athletes.const';
import { SeriesSwatch } from './compare-matrix.component';

const T = ATHLETE_PROFILE_TEXT.analysis;

interface ComparePickerProps {
  main: AthleteSummary;
  /** Athletes in the comparison (in order). */
  selected: readonly { slug: string; knownAs: string }[];
  /** Every athlete that can be added. */
  candidates: readonly AthleteSummary[];
  onChange: (slugs: string[]) => void;
}

/** "Adicionar à comparação" select (same sport first), colored chips with remove, and the explicit "Ninguém" option. */
export function ComparePicker({ main, selected, candidates, onChange }: ComparePickerProps) {
  const slugs = selected.map((s) => s.slug);
  const full = slugs.length >= ANALYSIS_MAX_ATHLETES;
  const free = candidates.filter((a) => a.slug !== main.slug && !slugs.includes(a.slug));
  const same = free.filter((a) => a.sport.slug === main.sport.slug);
  const rest = free.filter((a) => a.sport.slug !== main.sport.slug);
  const opt = (a: AthleteSummary) => (
    <option key={a.slug} value={a.slug}>
      {a.knownAs} · {a.sport.name}
    </option>
  );
  return (
    <div className="compare-picker">
      <div className="compare-picker-row">
        <FormField label={T.add} hint={T.count(slugs.length, ANALYSIS_MAX_ATHLETES)}>
          {(p) => (
            <Select {...p} value="" disabled={full} onChange={(e) => e.target.value && onChange([...slugs, e.target.value])}>
              <option value="">{full ? T.maxReached(ANALYSIS_MAX_ATHLETES) : T.choose}</option>
              {same.length > 0 && <optgroup label={T.sameSport(main.sport.name)}>{same.map(opt)}</optgroup>}
              {rest.length > 0 && <optgroup label={T.otherSports}>{rest.map(opt)}</optgroup>}
            </Select>
          )}
        </FormField>
        <Chip pressed={slugs.length === 0} onClick={() => onChange([])}>
          {T.nobody}
        </Chip>
      </div>
      <div className="compare-chips" role="group" aria-label={T.chipsLabel} aria-live="polite">
        <span className="compare-chip is-main">
          <SeriesSwatch index={0} />
          {main.knownAs}
        </span>
        {selected.map((s, i) => (
          <span key={s.slug} className="compare-chip">
            <SeriesSwatch index={i + 1} />
            {s.knownAs}
            <button type="button" aria-label={T.remove(s.knownAs)} onClick={() => onChange(slugs.filter((x) => x !== s.slug))}>
              ×
            </button>
          </span>
        ))}
        {!selected.length && <span className="muted text-[13px]">{T.nobodyHint}</span>}
      </div>
    </div>
  );
}
