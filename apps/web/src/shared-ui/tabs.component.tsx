import { type KeyboardEvent, type ReactNode, useId, useRef } from 'react';

import { useSlidingIndicator } from './use-sliding-indicator.hook';

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
  /** Small counter after the label (e.g. comments). */
  count?: number;
}

interface TabsProps<V extends string> {
  /** Accessible name of the tablist. */
  label: string;
  tabs: readonly TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Content of the active panel (only the active one is rendered). */
  children: ReactNode;
}

/**
 * WAI-ARIA tabs (roving tabindex, ←/→/Home/End). Controlled: keep `value` in the URL with
 * useUrlFilters(schema) so tabs are shareable (`?tab=comentarios`).
 */
export function Tabs<V extends string>({ label, tabs, value, onChange, children }: TabsProps<V>) {
  const base = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const tabId = (v: V) => `${base}-tab-${v}`;
  const panelId = `${base}-panel`;
  useSlidingIndicator(listRef, '[role="tab"][aria-selected="true"]', value);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((t) => t.value === value);
    const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    const next = tabs[(target + tabs.length) % tabs.length];
    if (!next) return;
    onChange(next.value);
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(next.value))}`)?.focus());
  };

  return (
    <>
      <div ref={listRef} className="tabs" role="tablist" aria-label={label} onKeyDown={onKeyDown}>
        {tabs.map((t) => {
          const selected = t.value === value;
          return (
            <button
              key={t.value}
              id={tabId(t.value)}
              type="button"
              role="tab"
              aria-selected={selected}
              // Only the active tab controls the (single) rendered panel.
              aria-controls={selected ? panelId : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(t.value)}
            >
              {t.label}
              {t.count !== undefined && <span className="count">{t.count}</span>}
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={tabId(value)} tabIndex={0}>
        {/* Keyed by tab so the new panel fades in (CSS .tab-panel-in); only the active panel is rendered anyway. */}
        <div key={value} className="tab-panel-in">
          {children}
        </div>
      </div>
    </>
  );
}
