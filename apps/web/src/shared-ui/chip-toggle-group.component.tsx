import type { ReactNode } from 'react';

import { Chip } from './chip.component';

export interface ChipOption<V extends string> {
  value: V;
  label: ReactNode;
  swatch?: string;
}

interface SingleProps<V extends string> {
  multiple?: false;
  value: V | undefined;
  /** Clicking the selected chip clears it (undefined) unless `required`. */
  onChange: (value: V | undefined) => void;
  required?: boolean;
}
interface MultiProps<V extends string> {
  multiple: true;
  value: readonly V[];
  onChange: (value: V[]) => void;
}

type ChipToggleGroupProps<V extends string> = {
  /** Accessible name of the group. */
  label: string;
  options: readonly ChipOption<V>[];
} & (SingleProps<V> | MultiProps<V>);

/** Group of toggle chips (role=group, aria-pressed): single choice (filters) or multiple (calendar sports). */
export function ChipToggleGroup<V extends string>(props: ChipToggleGroupProps<V>) {
  const isOn = (v: V) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: V) => {
    if (props.multiple) props.onChange(isOn(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    else props.onChange(isOn(v) && !props.required ? undefined : v);
  };
  return (
    <div className="chip-group" role="group" aria-label={props.label}>
      {props.options.map((o) => (
        <Chip key={o.value} pressed={isOn(o.value)} toggle={props.multiple ?? false} onClick={() => toggle(o.value)} {...(o.swatch ? { swatch: o.swatch } : {})}>
          {o.label}
        </Chip>
      ))}
    </div>
  );
}
