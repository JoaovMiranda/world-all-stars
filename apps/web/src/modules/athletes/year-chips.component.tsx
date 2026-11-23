import type { YearChip } from './year-chip.interface';

/** Wrapped list of small year chips ("1958", "2008 ×8", "2016 · #2"). */
export function YearChips({ chips }: { chips: readonly YearChip[] }) {
  return (
    <ul className="year-chips">
      {chips.map((c) => (
        <li key={c.key} className="year-chip" title={c.title}>
          {c.text}
          {c.title && <span className="sr-only"> ({c.title})</span>}
        </li>
      ))}
    </ul>
  );
}
