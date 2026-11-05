import { type AthleteProfile, type AthleteStats, AthleteStatsSchema, isCompetitionAchievement } from '@was/shared';
import { useCallback, useMemo } from 'react';
import { z } from 'zod';

import { barsOption } from '@/shared-ui/chart-presets.helper';
import type { ChartTheme } from '@/shared-ui/chart-theme.helper';
import { ChartContainer } from '@/shared-ui/chart-container.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { capitalize, formatNumber } from '@/shared-ui/format.helper';
import { Section } from '@/shared-ui/section.component';

import { GENERIC_STATS_MAX, ATHLETE_PROFILE_TEXT } from '../athletes.const';
import { kpi, metric, titleKpis, titleMetrics } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

const T = ATHLETE_PROFILE_TEXT.panels;
const HIDDEN_KEYS = new Set(['schema', '_kpis', '_labels']);

interface StatEntry {
  key: string;
  label: string;
  text: string;
  raw: unknown;
}

const pretty = (key: string) => capitalize(key.replace(/_/g, ' '));
const show = (v: unknown): string => (typeof v === 'number' ? formatNumber(v) : String(v));

/** Crawler stats as label/value rows: `_labels` give the pt-BR names; arrays and objects are flattened. */
const statEntries = (stats: AthleteStats | null): StatEntry[] => {
  if (!stats) return [];
  const labels = stats._labels ?? {};
  const label = (k: string) => labels[k] ?? pretty(k);
  return Object.entries(stats)
    .filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && v !== '')
    .map(([k, v]) => {
      const text = Array.isArray(v)
        ? v.map((x) => (x && typeof x === 'object' ? Object.values(x).map(show).join(' ') : show(x))).join(', ')
        : v && typeof v === 'object'
          ? Object.entries(v).map(([a, b]) => `${label(a)}: ${show(b)}`).join(' · ')
          : show(v);
      return { key: k, label: label(k), text, raw: v };
    });
};

function GenericPanel({ profile }: { profile: AthleteProfile; stats: AthleteStats | null }) {
  const entries = useMemo(() => statEntries(profile.stats).slice(0, GENERIC_STATS_MAX), [profile.stats]);
  const byComp = useMemo(() => {
    const counts = new Map<string, number>();
    profile.achievements.filter(isCompetitionAchievement).forEach((a) => counts.set(a.competition.name, (counts.get(a.competition.name) ?? 0) + 1));
    return [...counts].sort((a, b) => b[1] - a[1]);
  }, [profile.achievements]);
  const option = useCallback(
    (theme: ChartTheme) =>
      barsOption(theme, byComp.map(([n]) => n), [{ name: T.titles, data: byComp.map(([, c]) => c), color: `--${profile.sport.colorToken}` }], { horizontal: true, barMaxWidth: 16 }),
    [byComp, profile.sport.colorToken],
  );
  return (
    <Section title={T.genericTitle(profile.sport.name)} eyebrow={T.genericLabel(profile.stats?.schema ?? profile.sport.statsSchema)}>
      <div className="panel-split-even panel-split">
        {entries.length ? (
          <FactList variant="split" items={entries.map((e) => ({ key: e.key, term: e.label, detail: e.text }))} />
        ) : (
          <EmptyState compact title={T.noStats} mark="◇" />
        )}
        {byComp.length ? (
          <ChartContainer option={option} ariaLabel={T.byCompetitionChart} height={Math.max(160, byComp.length * 34 + 40)} summary={byComp.map(([n, c]) => `${n}: ${c}`).join(', ')} />
        ) : (
          <EmptyState compact title={T.noCompetitionTitles} mark="◇" />
        )}
      </div>
    </Section>
  );
}

export const GENERIC_PANEL: SportPanelDef<AthleteStats | null> = {
  schema: AthleteStatsSchema.nullable() as z.ZodType<AthleteStats | null>,
  kpis: (p, s) => [...(s?._kpis ?? []).slice(0, 2).map((k) => kpi(k.label_pt, k.value, k.hint_pt ?? undefined)), ...titleKpis(p)].slice(0, 4),
  compare: (p, s) => [
    ...titleMetrics(p),
    ...statEntries(s)
      .filter((e) => typeof e.raw === 'number')
      .slice(0, 6)
      .map((e) => metric(e.label, e.raw as number)),
  ],
  Panel: GenericPanel,
};
