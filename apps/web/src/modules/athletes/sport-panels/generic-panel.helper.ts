import type { AthleteStats } from '@was/shared';
import { capitalize, formatNumber } from '@/shared-ui/format.helper';
import type { StatEntry } from './stat-entry.interface';

const HIDDEN_KEYS = new Set(['schema', '_kpis', '_labels']);

const pretty = (key: string) => capitalize(key.replace(/_/g, ' '));
const show = (v: unknown): string => (typeof v === 'number' ? formatNumber(v) : String(v));

/** Crawler stats as label/value rows: `_labels` give the pt-BR names; arrays and objects are flattened. */
export const statEntries = (stats: AthleteStats | null): StatEntry[] => {
  if (!stats) return [];
  const labels = stats._labels ?? {};
  const label = (k: string) => labels[k] ?? pretty(k);
  return Object.entries(stats)
    .filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const text = Array.isArray(v)
        ? v.map((x) => (x && typeof x === 'object' ? Object.values(x).map(show).join(' ') : show(x))).join(', ')
        : v && typeof v === 'object'
          ? Object.entries(v)
              .map(([a, b]) => `${label(a)}: ${show(b)}`)
              .join(' · ')
          : show(v);
      return { key: k, label: label(k), text, raw: v };
    });
};
