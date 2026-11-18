import './review-kit.css';

import { useText } from '@/i18n/use-text.hook';

import { ChipToggleGroup } from './chip-toggle-group.component';
import { REVIEW_KIT_MESSAGES } from './review-kit.const';

export interface StatusFilterOption<V extends string> {
  value: V;
  label: string;
  count?: number;
}

interface StatusFilterProps<V extends string> {
  /** Accessible name of the group. */
  label: string;
  options: readonly StatusFilterOption<V>[];
  /** undefined = all. Keep it in the URL (`?status=`). */
  value: V | undefined;
  onChange: (value: V | undefined) => void;
  /** Total shown on the "Todos" chip. */
  total?: number;
  allLabel?: string;
}

const ALL = '__all';
const withCount = (label: string, count?: number) => (
  <>
    {label}
    {count !== undefined && <span className="chip-count">{count}</span>}
  </>
);

/** Status chips with counters + "Todos" (admin queues, lists). */
export function StatusFilter<V extends string>({ label, options, value, onChange, total, allLabel: allLabelProp }: StatusFilterProps<V>) {
  const kit = useText(REVIEW_KIT_MESSAGES);
  const allLabel = allLabelProp ?? kit.all;
  return (
    <ChipToggleGroup<V | typeof ALL>
      label={label}
      required
      options={[{ value: ALL, label: withCount(allLabel, total) }, ...options.map((o) => ({ value: o.value, label: withCount(o.label, o.count) }))]}
      value={value ?? ALL}
      onChange={(v) => onChange(v === ALL || v === undefined ? undefined : (v as V))}
    />
  );
}
