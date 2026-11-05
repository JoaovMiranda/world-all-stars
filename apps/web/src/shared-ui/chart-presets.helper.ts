import type { EChartsOption } from 'echarts';

import type { ChartTheme } from './chart-theme.helper';

/** One slice/series with its color as a CSS token name (`--success`, `--medal-gold`). */
export interface ChartSeriesSpec {
  name: string;
  data: readonly number[];
  color: string;
}

/** Donut with a centered label (record W/D/L, fight outcomes). Zero slices are dropped. */
export const donutOption = (
  { cssVar }: ChartTheme,
  slices: readonly { name: string; value: number; color: string }[],
  center: string,
): EChartsOption => ({
  legend: { bottom: 0, top: 'auto', left: 'center' },
  tooltip: { trigger: 'item', formatter: '{b}: <b>{c}</b> ({d}%)' },
  series: [
    {
      type: 'pie',
      radius: ['50%', '72%'],
      center: ['50%', '42%'],
      label: { show: true, position: 'center', formatter: () => center, color: cssVar('--text'), fontFamily: cssVar('--font-display'), fontWeight: 700, fontSize: 18, lineHeight: 22 },
      itemStyle: { borderColor: cssVar('--surface'), borderWidth: 2 },
      emphasis: { scale: false, label: { show: true } },
      data: slices.filter((s) => s.value > 0).map((s) => ({ name: s.name, value: s.value, itemStyle: { color: cssVar(s.color) } })),
    },
  ],
});

interface BarsOptions {
  /** Stack every series on one bar. */
  stack?: boolean;
  /** Categories on the y axis (long names). */
  horizontal?: boolean;
  barMaxWidth?: number;
}

/** Grouped/stacked bars over categories (years, editions, competitions), colors from tokens. */
export const barsOption = (
  { cssVar, axis }: ChartTheme,
  categories: readonly (string | number)[],
  series: readonly ChartSeriesSpec[],
  { stack = false, horizontal = false, barMaxWidth = 22 }: BarsOptions = {},
): EChartsOption => {
  const cat = { type: 'category' as const, data: categories.map(String), ...axis({ splitLine: { show: false } }), ...(horizontal ? { inverse: true } : {}) };
  const val = { type: 'value' as const, minInterval: 1, ...axis() };
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    ...(series.length > 1 ? {} : { legend: { show: false } }),
    ...(horizontal ? { grid: { left: 8, right: 24, top: 8, bottom: 8, containLabel: true } } : {}),
    xAxis: horizontal ? val : cat,
    yAxis: horizontal ? cat : val,
    series: series.map((s) => ({
      name: s.name,
      type: 'bar' as const,
      ...(stack ? { stack: 'total' } : {}),
      barMaxWidth,
      data: [...s.data],
      itemStyle: { color: cssVar(s.color), borderRadius: 2 },
    })),
  };
};
