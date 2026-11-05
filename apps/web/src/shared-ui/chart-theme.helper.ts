import type { EChartsOption } from 'echarts';

/** Reads a CSS custom property of the current theme (`cssVar('--muted')`). */
export const cssVar = (name: string): string => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

/** Base ECharts option from the theme tokens (doc 08: short linear animation, no bounce). */
export const chartBaseOption = (): EChartsOption => ({
  animationDuration: 250,
  animationEasing: 'linear',
  animationDurationUpdate: 150,
  textStyle: { fontFamily: cssVar('--font-ui'), color: cssVar('--muted') },
  grid: { left: 8, right: 8, top: 36, bottom: 8, containLabel: true },
  tooltip: { backgroundColor: cssVar('--surface'), borderColor: cssVar('--border'), borderWidth: 1, textStyle: { color: cssVar('--text'), fontSize: 12 } },
  legend: { top: 0, left: 0, icon: 'roundRect', itemWidth: 10, itemHeight: 10, textStyle: { color: cssVar('--muted'), fontSize: 12 } },
});

/** Axis style from the tokens; spread into xAxis/yAxis. */
export const chartAxis = <T extends object>(extra?: T) => ({
  axisLine: { lineStyle: { color: cssVar('--border') } },
  axisTick: { show: false },
  axisLabel: { color: cssVar('--muted'), fontSize: 11 },
  splitLine: { lineStyle: { color: cssVar('--border'), type: 'dashed' as const } },
  ...extra,
});

export interface ChartTheme {
  cssVar: typeof cssVar;
  axis: typeof chartAxis;
}
