import type { EChartsOption } from 'echarts';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { type ChartTheme, chartAxis, chartBaseOption, cssVar } from './chart-theme.helper';
import { useEffectiveTheme } from './theme.store';
import { UI_MESSAGES } from './ui-text.const';

interface ChartContainerProps {
  /** Builds the option from the current theme tokens (called again on theme change). Keep it stable (useCallback). */
  option: (theme: ChartTheme) => EChartsOption;
  /** Accessible name of the chart image. */
  ariaLabel: string;
  /** Height in px (default 280). */
  height?: number;
  /** Text alternative (summary or a small table) for screen readers. */
  summary?: ReactNode;
}

type EChartsModule = typeof import('echarts');
let echartsPromise: Promise<EChartsModule> | null = null;
/** ECharts (~1 MB) is loaded on demand, once, in its own chunk (doc 14: LCP/TBT). */
const loadECharts = () => (echartsPromise ??= import('echarts'));

/** ECharts wrapper: lazy library, SVG renderer, theme from CSS variables, re-render on theme change and resize. */
export function ChartContainer({ option, ariaLabel, height = 280, summary }: ChartContainerProps) {
  const ui = useText(UI_MESSAGES);
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<ReturnType<EChartsModule['init']> | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const theme = useEffectiveTheme();

  useEffect(() => {
    let disposed = false;
    const el = ref.current;
    if (!el) return;
    loadECharts()
      .then((echarts) => {
        if (disposed) return;
        chart.current = echarts.init(el, null, { renderer: 'svg' });
        setReady(true);
      })
      .catch(() => setFailed(true));
    const observer = new ResizeObserver(() => chart.current?.resize());
    observer.observe(el);
    return () => {
      disposed = true;
      observer.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready || !chart.current) return;
    const built = option({ cssVar, axis: chartAxis });
    chart.current.setOption({ ...chartBaseOption(), ...built }, true);
  }, [ready, option, theme]);

  if (failed) return <p className="muted">{ui.chartError}</p>;
  return (
    <figure className="m-0">
      <div ref={ref} className="chart" style={{ '--chart-h': `${height}px` } as CSSProperties} role="img" aria-label={ariaLabel} aria-busy={!ready} />
      {summary && <figcaption className="sr-only">{summary}</figcaption>}
    </figure>
  );
}
